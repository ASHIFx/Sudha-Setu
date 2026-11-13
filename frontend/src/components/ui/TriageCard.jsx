import { Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';
import useSpeech from '../../hooks/useSpeech.js';

const TIER_META = {
  low: {
    title: 'Home Care & Rest (Mild)',
    subtitle: 'Your symptoms appear mild and safe to manage with restorative home care and healthy food habits.',
    headerClass: 'bg-emerald-950/50 border-b border-emerald-500/30 text-emerald-300',
    badgeClass: 'badge-green',
  },
  medium: {
    title: 'Doctor OPD Review Recommended (Moderate)',
    subtitle: 'Your symptoms require evaluation by a certified physician. Your case is ready for doctor review.',
    headerClass: 'bg-amber-950/50 border-b border-amber-500/30 text-amber-300',
    badgeClass: 'badge-amber',
  },
  high: {
    title: 'Emergency Care Needed (Urgent)',
    subtitle: 'Urgent markers detected. Emergency hospital identified and ambulance fleet dispatch alerted.',
    headerClass: 'bg-rose-950/50 border-b border-rose-500/30 text-rose-300',
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
      parts.push('Helpful Advice: ' + advice.generalTips.join('. '));
    }
    if (advice.ayurvedicDietaryNotes?.length) {
      parts.push('Food Guidance: ' + advice.ayurvedicDietaryNotes.join('. '));
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
    <div className="bg-[#062016]/95 border border-[#124731] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
              speaking
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-[#04150E] text-emerald-300 border-[#124731] hover:bg-[#0B2E20]'
            }`}
          >
            {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{speaking ? 'Stop Audio' : 'Listen (Soft Voice)'}</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-4 text-xs">
        {requiresHumanReview && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 font-medium">
            Doctor Notice: A doctor has been notified and will review your symptoms for personalized follow-up.
          </div>
        )}

        {advice.generalTips?.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Helpful Daily Guidance</span>
            </h4>
            <ul className="space-y-1 text-emerald-100/80 pl-4 list-disc">
              {advice.generalTips.map((tip, i) => (
                <li key={i} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {advice.ayurvedicDietaryNotes?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#124731]">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Food & Dietary Balance (Ahara)
            </h4>
            <ul className="space-y-1 text-emerald-100/80 pl-4 list-disc">
              {advice.ayurvedicDietaryNotes.map((note, i) => (
                <li key={i} className="leading-relaxed">{note}</li>
              ))}
            </ul>
          </div>
        )}

        {advice.safeRemedies?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#124731]">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Safe Home Remedies & Herbs
            </h4>
            <ul className="space-y-1 text-emerald-100/80 pl-4 list-disc">
              {advice.safeRemedies.map((rem, i) => (
                <li key={i} className="leading-relaxed">{rem}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}