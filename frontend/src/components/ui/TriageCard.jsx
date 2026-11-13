import { Volume2, VolumeX } from 'lucide-react';
import useSpeech from '../../hooks/useSpeech.js';

const TIER_META = {
  low: {
    title: 'Tier 1: Low Risk (Green) — Home Care Regimen',
    subtitle: 'Symptoms appear mild. Follow dietary balance and restorative home wellness guidance below.',
    headerClass: 'bg-emerald-950/40 border-b border-emerald-500/20 text-emerald-300',
    badgeClass: 'badge-green',
  },
  medium: {
    title: 'Tier 2: Medium Risk (Amber) — Physician OPD Review',
    subtitle: 'Symptoms require clinical review. Your case is queued for physician evaluation.',
    headerClass: 'bg-amber-950/40 border-b border-amber-500/20 text-amber-300',
    badgeClass: 'badge-amber',
  },
  high: {
    title: 'Tier 3: High Risk (Red) — Emergency Protocol Active',
    subtitle: 'Critical markers detected. Nearest emergency hospital identified and ambulance dispatch alerted.',
    headerClass: 'bg-rose-950/40 border-b border-rose-500/20 text-rose-300',
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
              speaking
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{speaking ? 'Stop Audio' : 'Read Aloud'}</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 text-xs">
        {requiresHumanReview && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200 font-medium">
            Clinical Notice: A physician will review your case record and provide formal follow-up instructions.
          </div>
        )}

        {advice.ayurvedicDietaryNotes?.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Nutritional & Dietary Recommendations (Ahara)
            </h4>
            <ul className="space-y-1 text-slate-300 pl-4 list-disc">
              {advice.ayurvedicDietaryNotes.map((note, i) => (
                <li key={i} className="leading-relaxed">{note}</li>
              ))}
            </ul>
          </div>
        )}

        {advice.safeRemedies?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Safe Home Remedies & Herbal Infusions
            </h4>
            <ul className="space-y-1 text-slate-300 pl-4 list-disc">
              {advice.safeRemedies.map((remedy, i) => (
                <li key={i} className="leading-relaxed">{remedy}</li>
              ))}
            </ul>
          </div>
        )}

        {advice.generalTips?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              General Wellness Guidelines
            </h4>
            <ul className="space-y-1 text-slate-300 pl-4 list-disc">
              {advice.generalTips.map((tip, i) => (
                <li key={i} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Case Identifier: <span className="font-mono text-emerald-400 font-bold">{caseId || 'INTAKE-TEMP'}</span></span>
          <span className="capitalize">Status: <strong className="text-slate-200">{status?.replace(/_/g, ' ') || 'Pending'}</strong></span>
        </div>
      </div>
    </div>
  );
}
