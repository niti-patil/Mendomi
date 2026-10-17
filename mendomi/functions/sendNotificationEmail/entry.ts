const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Maps notification type → the PatientProfile toggle that gates it.
const TYPE_TOGGLE = {
  medication_reminder: 'medication_reminders',
  daily_checkin: 'daily_checkin_reminders',
  appointment_reminder: 'appointment_reminders',
  caregiver_alert: 'caregiver_alerts'
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function base64urlEncode(str) {
  // btoa works on Latin-1; for ASCII reminder emails this is fine.
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildRawMime(to, subject, body) {
  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    body
  ].join('\r\n');
  return base64urlEncode(mime);
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const to = (body.to || '').trim();
    const subject = (body.subject || '').trim();
    const emailBody = (body.body || '').trim();
    const type = body.type;
    if (!to || !subject || !emailBody) {
      return Response.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }
    if (!TYPE_TOGGLE[type]) {
      return Response.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    // Check the patient's opt-in toggle for this type before sending anything.
    const profiles = await db.entities.PatientProfile.filter({});
    const profile = profiles[0] || {};
    const masterOptIn = profile.email_opt_in !== false; // default true
    const typeOptIn = profile[TYPE_TOGGLE[type]] !== false; // default true (caregiver_alerts defaults false via schema)
    const canSend = masterOptIn && typeOptIn;
    if (!canSend) {
      return Response.json({ sent: false, reason: 'opt_in_disabled', type });
    }

    // Enforce one reminder of the same type per day per patient.
    const refDate = todayStr();
    const existing = await db.entities.EmailLog.filter({ message_type: type, reference_date: refDate });
    if (existing && existing.length > 0) {
      return Response.json({ sent: false, reason: 'already_sent_today', type });
    }

    // Resolve the recipient: prefer the explicit `to`, fall back to the patient's notification_email.
    const recipient = to || profile.notification_email || user.email;

    // Send via the connected Gmail integration (shared connector token).
    let deliveryStatus = 'success';
    let errorMessage = '';
    try {
      const { accessToken } = await db.asServiceRole.connectors.getConnection('gmail');
      if (!accessToken) throw new Error('Gmail connection not available');
      const raw = buildRawMime(recipient, subject, emailBody);
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gmail API ${res.status}: ${errText}`);
      }
    } catch (e) {
      deliveryStatus = 'failed';
      errorMessage = e.message || String(e);
    }

    // Log every send attempt (success or failure) to EmailLog.
    await db.entities.EmailLog.create({
      message_type: type,
      recipient_email: recipient,
      subject,
      sent_at: new Date().toISOString(),
      delivery_status: deliveryStatus,
      error_message: errorMessage,
      reference_date: refDate
    });

    if (deliveryStatus === 'failed') {
      return Response.json({ sent: false, reason: 'send_failed', error: errorMessage, type });
    }
    return Response.json({ sent: true, type, recipient });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}