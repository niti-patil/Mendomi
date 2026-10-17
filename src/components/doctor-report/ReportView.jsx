import { Pill, TrendingDown, Moon, Footprints, AlertTriangle, Sparkles, Thermometer, Flag } from 'lucide-react';
import Sparkline from './Sparkline';

const TREND_META = {
  improving: { label: 'Improving', cls: 'text-success bg-success/10' },
  stable: { label: 'Stable', cls: 'text-chart-4 bg-chart-4/15' },
  worsening: { label: 'Worsening', cls: 'text-destructive bg-destructive/10' },
};

export default function ReportView({ report, readOnly }) {
  const inc = report.included_sections || {};
  const trend = TREND_META[report.pain_trend_label] || TREND_META.stable;

  const hasMedData = report.scheduled_doses != null && report.scheduled_doses > 0;
  const hasPainData = report.pain_first != null || report.pain_recent != null;
  const hasSleepData = report.nights_logged != null && report.nights_logged > 0;
  const hasActivityData = report.avg_walk_minutes != null && report.avg_walk_minutes > 0;
  const hasFlagsData = (report.fever_days?.length || 0) > 0 || (report.concern_notes?.length || 0) > 0;
  const hasSummary = !!report.ai_summary;

  const anySectionHasData =
    (inc.medication && hasMedData) ||
    (inc.pain && hasPainData) ||
    (inc.sleep && hasSleepData) ||
    (inc.activity && hasActivityData) ||
    (inc.flags && hasFlagsData) ||
    (inc.summary && hasSummary);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Recovery report</div>
            <h2 className="font-display text-xl font-semibold">{report.patient_name || 'Patient'}</h2>
            {report.surgery_type && <div className="text-sm text-muted-foreground">{report.surgery_type}{report.surgery_date ? ` · ${report.surgery_date}` : ''}</div>}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{report.generated_date}</div>
            <div>{report.period_start} → {report.period_end}</div>
            <div>{report.days_tracked} days</div>
          </div>
        </div>
      </div>

      {!anySectionHasData && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-display text-base font-semibold text-foreground">No recovery data yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">This report doesn't have enough information to display. Make sure symptom check-ins, medications, and activities are being logged regularly before generating a report.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
      {inc.medication && (
        <Section icon={Pill} title="Medication adherence">
          <Big value={`${report.medication_adherence_pct ?? 0}%`} />
          <Muted>{report.taken_doses ?? 0} of {report.scheduled_doses ?? 0} scheduled doses taken</Muted>
        </Section>
      )}

      {inc.pain && (
        <Section icon={TrendingDown} title="Pain trend">
          <div className="flex items-center gap-3">
            <Big value={`${report.pain_first ?? '—'} → ${report.pain_recent ?? '—'}`} small />
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trend.cls}`}>{trend.label}</span>
          </div>
          {report.pain_series?.length > 0 && (
            <div className="mt-3"><Sparkline data={report.pain_series} /></div>
          )}
        </Section>
      )}

      {inc.sleep && (
        <Section icon={Moon} title="Sleep quality">
          <Big value={`${report.poor_sleep_count ?? 0}`} small />
          <Muted>poor night(s) out of {report.nights_logged ?? 0} nights logged</Muted>
        </Section>
      )}

      {inc.activity && (
        <Section icon={Footprints} title="Activity">
          <Big value={`${report.avg_walk_minutes ?? 0} min/day`} small />
          <Muted>target {report.walk_target ?? 20} min · met on {report.walk_days_met ?? 0} day(s)</Muted>
        </Section>
      )}

      {inc.flags && (
        <Section icon={AlertTriangle} title="Symptom flags">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-destructive" />
              <span>{(report.fever_days || []).length} day(s) with fever</span>
              {(report.fever_days || []).length > 0 && <span className="text-muted-foreground">{report.fever_days.join(', ')}</span>}
            </div>
            <div className="flex items-start gap-2">
              <Flag className="w-4 h-4 text-chart-5 mt-0.5" />
              <div>
                <div>{(report.concern_notes || []).length} patient-flagged concern(s)</div>
                {(report.concern_notes || []).map((n, i) => (
                  <div key={i} className="text-xs text-muted-foreground mt-0.5">{n}</div>
                ))}
              </div>
            </div>
            {(report.fever_days || []).length === 0 && (report.concern_notes || []).length === 0 && (
              <div className="text-muted-foreground">None reported this period.</div>
            )}
          </div>
        </Section>
      )}

      {inc.summary && report.ai_summary && (
        <Section icon={Sparkles} title="Summary for your doctor">
          <p className="text-sm leading-relaxed whitespace-pre-line">{report.ai_summary}</p>
          <p className="text-xs text-muted-foreground mt-3 italic">Descriptive only — not a diagnosis or treatment recommendation.</p>
        </Section>
      )}
      </div>

      {readOnly && (
        <div className="text-center text-xs text-muted-foreground pt-2 print:hidden">
          Shared read-only view · Recovery Companion
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 print:border-black/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center"><Icon className="w-4 h-4" /></span>
        <h3 className="font-medium">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Big({ value, small }) {
  return <div className={`font-display font-semibold ${small ? 'text-lg' : 'text-3xl'}`}>{value}</div>;
}
function Muted({ children }) {
  return <div className="text-sm text-muted-foreground mt-0.5">{children}</div>;
}