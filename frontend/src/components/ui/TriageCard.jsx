import { Volume2, VolumeX } from 'lucide-react';
import useSpeech from '../../hooks/useSpeech.js';

const TIER_META = {
  low: {
    title: 'Tier 1: Low Risk (Green) — Verified Self-Care',
    subtitle: 'Symptoms appear mild and non-critical. Follow classical Ayush Ahara and Dinacharya guidance below.',
    headerClass: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  medium: {
    title: 'Tier 2: Medium Risk (Amber) — Physician OPD Review',
    subtitle: 'Symptoms require clinical verification. Case is queued in the OPD consultation stream.',
    headerClass: 'bg-amber-50 border-amber-200 text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  high: {
    title: 'Tier 3: High Risk (Red) — Emergency Protocol Active',
    subtitle: 'Critical distress markers detected. Nearest hospital identified and ambulance dispatch alerted.',
    headerClass: 'bg-rose-50 border-rose-200 text-rose-900',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
  },
};

export default function TriageCard({ dangerLevel, verifiedAdvice, requiresHumanReview, status, caseId, lang = 'hi-IN' }) {
  const meta = TIER_META[dangerLevel] ?? TIER_META.low;
  const advice = verifiedAdvice ?? {};
  const { speak, stopSpeaking, speaking, ttsSupported } = useSpeech({ lang });

  const buildSpeechText = () => {
    const parts = [meta.title, meta.subtitle];
    if (advice.generalTips?.length) {
      parts.push('General Advice: ' + advice.generalTips.join('. '));
    }
    if (advice.ayurvedicDietaryNotes?.length) {
      parts.push('Ayurvedic Dietary Notes: ' + advice.ayurvedicDietaryNotes.join('. '));
    }
    if (advice.safeRemedies?.length) {
      parts.push('Safe Home Remedies: ' + advice.safeRemedies.join('. '));
    }
    return parts.join('. ');
  };

  const handleToggleSpeech = () => {
    if (speaking) {
      stopSpeaking();
    } else {
      speak(buildSpeechText(), { lang });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
      <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${meta.headerClass}`}>
        <div>
          <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${meta.badgeClass}`}>
            {meta.title}
          </span>
          <p className="text-xs mt-1 font-medium">{meta.subtitle}</p>
        </div>

        {ttsSupported && (
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors flex items-center gap-1.5 self-start sm:self-auto ${
              speaking
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{speaking ? 'Stop Audio' : 'Read Guidance Aloud'}</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 text-xs">
        {requiresHumanReview && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 font-medium">
            Clinical Note: An Ayush medical officer will review your symptom extraction and update your prescription record.
          </div>
        )}

        {advice.ayurvedicDietaryNotes?.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
              Ayurvedic Ahara (Dietary Protocols)
            </h4>
            <ul className="space-y-1 text-slate-700 pl-4 list-disc">
              {advice.ayurvedicDietaryNotes.map((note, i) => (
                <li key={i} className="leading-relaxed">{note}</li>
              ))}
            </ul>
          </div>
        )}

        {advice.safeRemedies?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
              Classical Home Remedies (Pathya Regimen)
            </h4>
            <ul className="space-y-1 text-slate-700 pl-4 list-disc">
              {advice.safeRemedies.map((remedy, i) => (
                <li key={i} className="leading-relaxed">{remedy}</li>
              ))}
            </ul>
          </div>
        )}

        {advice.generalTips?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
              General Clinical Guidelines
            </h4>
            <ul className="space-y-1 text-slate-700 pl-4 list-disc">
              {advice.generalTips.map((tip, i) => (
                <li key={i} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Case Record: <span className="font-mono text-slate-600 font-bold">{caseId || 'INTAKE-TEMP'}</span></span>
          <span className="capitalize">Status: <strong className="text-slate-700">{status?.replace(/_/g, ' ') || 'Pending'}</strong></span>
        </div>
      </div>
    </div>
  );
}
