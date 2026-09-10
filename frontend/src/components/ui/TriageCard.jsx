import { CheckCircle, AlertTriangle, XCircle, Info, Leaf } from 'lucide-react';

const LEVEL_CONFIG = {
  low: {
    wrapper: 'bg-green-50 border-green-200 text-green-900',
    header: 'bg-green-100 border-green-200',
    badge: 'badge-green',
    labelColor: 'text-green-700',
    icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    label: 'Low Risk — Green',
    tagline: 'Your symptoms appear mild. Follow the advice below.',
  },
  medium: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-900',
    header: 'bg-amber-100 border-amber-200',
    badge: 'badge-amber',
    labelColor: 'text-amber-700',
    icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    label: 'Medium Risk — Amber',
    tagline: 'A doctor has been alerted. You are in the OPD queue.',
  },
  high: {
    wrapper: 'bg-red-50 border-red-200 text-red-900',
    header: 'bg-red-100 border-red-200',
    badge: 'badge-red',
    labelColor: 'text-red-700',
    icon: <XCircle className="w-6 h-6 text-red-600" />,
    label: 'High Risk — Red',
    tagline: 'Emergency services have been alerted.',
  },
};

export default function TriageCard({ dangerLevel, verifiedAdvice, requiresHumanReview, status, caseId }) {
  const cfg = LEVEL_CONFIG[dangerLevel] ?? LEVEL_CONFIG.low;
  const advice = verifiedAdvice ?? {};

  return (
    <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${cfg.wrapper}`}>
      <div className={`px-6 py-4 border-b ${cfg.header} flex items-center gap-3`}>
        {cfg.icon}
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider ${cfg.labelColor}`}>
            {cfg.label}
          </p>
          <p className="text-sm mt-0.5">{cfg.tagline}</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {requiresHumanReview && (
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-100 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>A healthcare professional will review your case shortly.</span>
          </div>
        )}

        {dangerLevel === 'medium' && (
          <div className="bg-white rounded-xl border border-amber-200 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Queue Status</p>
            <p className="mt-1 capitalize">{status?.replace(/_/g, ' ')}</p>
          </div>
        )}

        {advice.generalTips?.length > 0 && (
          <section>
            <p className="font-semibold text-sm mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> General Tips
            </p>
            <ul className="space-y-1.5">
              {advice.generalTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5 text-green-600">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {advice.ayurvedicDietaryNotes?.length > 0 && (
          <section>
            <p className="font-semibold text-sm mb-2 flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-green-600" /> Ayurvedic Diet Notes
            </p>
            <ul className="space-y-1.5">
              {advice.ayurvedicDietaryNotes.map((note, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5 text-green-600">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {advice.safeRemedies?.length > 0 && (
          <section>
            <p className="font-semibold text-sm mb-2">Safe Home Remedies</p>
            <ul className="space-y-1.5">
              {advice.safeRemedies.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5">🌿</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {dangerLevel === 'low' && !advice.generalTips?.length && (
          <p className="text-sm text-green-800">
            Rest well, stay hydrated, and monitor your symptoms. If they worsen, return for another assessment.
          </p>
        )}

        {caseId && (
          <p className="text-xs text-slate-400 pt-2 border-t border-current/10">Case ID: {caseId}</p>
        )}
      </div>
    </div>
  );
}
