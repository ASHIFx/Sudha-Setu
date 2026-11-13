import { Volume2, VolumeX } from 'lucide-react';
import useSpeech from '../../hooks/useSpeech.js';

const TIER_META = {
  low: {
    title: 'Tier 1: Low Risk (Green) — Home Care Regimen',
    subtitle: 'Symptoms appear mild. Follow dietary balance and restorative home wellness guidance below.',
    headerClass: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
    badgeClass: 'badge-green',
  },
  medium: {
    title: 'Tier 2: Medium Risk (Amber) — Physician OPD Review',
    subtitle: 'Symptoms require clinical review. Your case is queued for physician evaluation.',
    headerClass: 'bg-amber-50/70 border-amber-200/80 text-amber-900',
    badgeClass: 'badge-amber',
  },
  high: {
    title: 'Tier 3: High Risk (Red) — Emergency Protocol Active',
    subtitle: 'Critical markers detected. Nearest emergency hospital identified and ambulance dispatch alerted.',
    headerClass: 'bg-rose-50/70 border-rose-200/80 text-rose-900',
    badgeClass: 'badge-red',
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
      parts.push('Dietary Guidance: ' + advice.ayurvedicDietaryNotes.join('. '));
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
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-sm overflow-hidden">
      <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${meta.headerClass}`}>
        <div>
          <span className={meta.badgeClass}>
            {meta.title}
          </span>
          <p className="text-xs mt-1.5 font-medium">{meta.subtitle}</p>
        </div>

        {ttsSupported && (
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 self-start sm:self-auto ${
              speaking
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{speaking ? 'Stop Audio' : 'Read Aloud'}</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 text-xs">
        {requiresHumanReview && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
            Clinical Notice: A physician will review your case record and provide formal follow-up instructions.
          </div>
        )}

        {advice.ayurvedicDietaryNotes?.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Nutritional & Dietary Recommendations (Ahara)
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
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Safe Home Remedies & Herbal Infusions
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
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              General Wellness Guidelines
            </h4>
            <ul className="space-y-1 text-slate-700 pl-4 list-disc">
              {advice.generalTips.map((tip, i) => (
                <li key={i} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Case Identifier: <span className="font-mono text-slate-700 font-bold">{caseId || 'INTAKE-TEMP'}</span></span>
          <span className="capitalize">Status: <strong className="text-slate-700">{status?.replace(/_/g, ' ') || 'Pending'}</strong></span>
        </div>
      </div>
    </div>
  );
}
