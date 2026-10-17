// Shared urgent-symptom detection for recovery chat responses.
// Used by askAssistant (backend) and mirrored by the demo client (frontend).
// Strips apostrophes so "can't breathe" and "cant breathe" both match.

export const URGENT_PATTERNS = [
  // Breathing
  "shortness of breath", "cant breathe", "cannot breathe", "struggling to breathe",
  "trouble breathing", "hard to breathe", "difficulty breathing", "breathing problem",
  "cant catch my breath", "wheezing", "choking", "gasping",
  // Cardiac
  "heart attack", "chest pain", "chest pressure", "chest tightness", "crushing chest",
  "pain radiating", "radiating to", "pain in my arm", "pain in my jaw", "racing heart",
  "irregular heartbeat", "heart racing",
  // Bleeding
  "severe bleeding", "heavy bleeding", "cant stop bleeding", "bleeding heavily",
  "bleeding a lot", "bleeding wont stop", "wont stop bleeding", "coughing up blood",
  "coughing blood", "vomiting blood", "throwing up blood", "blood in vomit",
  "blood in stool", "black stool", "tarry stool", "bright red blood", "passing blood",
  // Neurological / stroke
  "fainting", "passed out", "passing out", "loss of consciousness", "unconscious",
  "not responsive", "cant respond", "numbness", "cant feel my", "cant feel my legs",
  "weakness on one side", "face drooping", "face dropping", "slurred speech", "cant speak",
  "cant move my", "cant move one", "sudden weakness", "sudden numbness", "dizziness",
  "lightheaded", "seizure", "convulsion", "stroke", "fast sudden", "sudden severe",
  // Fever / infection
  "high fever", "fever over", "fever above", "fever of 10", "fever 101", "fever 102",
  "fever 103", "fever 104", "shaking chills", "rigors",
  "signs of infection", "redness spreading", "spreading redness", "pus", "discharging pus",
  "infected incision", "wound infected", "hot to the touch", "foul odor", "foul smell",
  "bad smell from", "incision hot",
  // Pain
  "uncontrollable pain", "unbearable pain", "worst pain", "excruciating",
  "severe pain", "extreme pain", "pain is unbearable", "pain wont stop",
  "pain out of control", "10 out of 10 pain", "pain 10",
  // Urinary / abdominal
  "unable to urinate", "cant urinate", "cant pee", "no urine", "havent urinated",
  "blood in urine", "severe abdominal", "abdomen rigid", "stomach hard",
  // Swelling / DVT
  "leg swelling", "calf swelling", "swollen leg", "one leg swollen", "swollen calf",
  "sudden swelling", "warm and swollen", "painful swelling",
  // Mental health crisis
  "suicidal", "suicide", "kill myself", "want to die", "wanna die", "ending my life",
  "end my life", "hurt myself", "self harm", "self-harm", "hopeless", "dont want to live",
  "dont want to be here", "thoughts of harming",
  // Allergic reaction
  "anaphylaxis", "throat closing", "swollen throat", "lips swelling", "lips swollen",
  "tongue swelling", "tongue swollen", "severe allergic", "hives spreading",
  "cant swallow", "swelling of the throat",
  // Misc critical
  "blue lips", "turning blue", "clammy and pale", "going into shock", "in shock",
  "not breathing", "stopped breathing", "collapsed",
];

export function isUrgent(text) {
  const lower = (text || "").toLowerCase().replace(/['’`]/g, "");
  return URGENT_PATTERNS.some((k) => lower.includes(k));
}

export const URGENT_REASON = "This may need urgent attention — contact your doctor or seek emergency care right away.";