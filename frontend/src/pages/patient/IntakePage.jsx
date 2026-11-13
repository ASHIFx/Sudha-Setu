import { useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff, RotateCcw, Sparkles, Volume2, VolumeX, Heart, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import useSpeech from '../../hooks/useSpeech.js';
import { useAppLanguage } from '../../lib/languageContext.js';
import { SUPPORTED_LANGUAGES } from '../../lib/translations.js';
import TriageCard from '../../components/ui/TriageCard.jsx';
import SosOverlay from '../../components/ui/SosOverlay.jsx';

const SAMPLE_SCENARIOS = [
  { label: '👋 Say "Hii" / "Hlw"', text: 'Hii there! How are you doing today?' },
  { label: '🍵 Acidity / Indigestion', text: 'I have had continuous stomach burning and acidity after eating heavy dinner.' },
  { label: '🩺 Moderate Fever & Cough', text: 'Persistent fever for 3 days with dry cough, throat pain, and mild body ache.' },
  { label: '🚨 Chest Pain (Emergency)', text: 'Severe crushing chest pain radiating to left arm with difficulty breathing.' },
];

export default function IntakePage() {
  const user = useSelector((s) => s.auth.user);
  const routeLocation = useLocation();
  const { langCode, langObj, t, changeLanguage } = useAppLanguage();

  const [textInput, setTextInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const locationRef = useRef(null);

  const onSpeechResult = useCallback((transcript) => {
    setTextInput(transcript);
  }, []);

  const { listening, supported, ttsSupported, toggle, reset, speak, stopSpeaking, speaking } = useSpeech({
    lang: langObj.locale,
    onResult: onSpeechResult,
  });

  useEffect(() => {
    if (routeLocation.state?.prefilledText) {
      setTextInput(routeLocation.state.prefilledText);
    }
  }, [routeLocation.state]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation && !locationRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => {},
        { timeout: 2000, maximumAge: 300000 }
      );
    }
  }, []);

  const handleSubmit = async (overrideText) => {
    const text = (overrideText || textInput).trim();
    if (!text) {
      toast.error('Please describe how you are feeling or speak into the microphone.');
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await api.post('/cases/intake', {
        patientText: text,
        languageUsed: langCode,
        location: locationRef.current ?? undefined,
      });
      setResult(data);
      if (data.emergency || data.dangerLevel === 'high') {
        setSosActive(true);
      }
      if (data.isGreeting && data.greetingMessage) {
        speak(data.greetingMessage, { lang: langObj.locale });
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Health assessment failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    stopSpeaking();
    setTextInput('');
    setResult(null);
    setSosActive(false);
    locationRef.current = null;
  };

  const handleLanguageChange = (code) => {
    changeLanguage(code);
    reset();
    stopSpeaking();
  };

  return (
    <div className="bg-[#04150E] min-h-[calc(100vh-4rem)] py-8 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {sosActive && result && (
        <SosOverlay caseId={result.caseId} onDismiss={() => setSosActive(false)} />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="bg-[#062016]/90 border border-[#124731] rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.charak.badge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                {t.charak.title}
              </h1>
              <p className="text-xs text-emerald-100/70 mt-1">
                {t.charak.subtitle}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-emerald-300">{t.charak.chooseLanguage}</span>
              <div className="flex flex-wrap gap-1">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      langCode === l.code
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-[#04150E] text-emerald-100/70 border-[#124731] hover:text-white hover:bg-[#0B2E20]'
                    }`}
                  >
                    {l.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!result && (
          <div className="bg-[#062016]/90 border border-[#124731] rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between p-4 bg-[#04150E] border border-[#124731] rounded-xl">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  {listening && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />}
                  <span>{listening ? t.charak.listening : `${t.charak.tapToSpeak} (${langObj.label})`}</span>
                </p>
                <p className="text-xs text-emerald-100/60 mt-0.5">
                  {listening ? t.charak.listeningDesc : t.charak.idleDesc}
                </p>
              </div>

              {supported ? (
                <button
                  type="button"
                  onClick={toggle}
                  disabled={submitting}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    listening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-lg shadow-rose-600/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{listening ? t.charak.stopVoice : t.charak.startVoice}</span>
                </button>
              ) : (
                <span className="text-xs text-amber-300">Type below</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="symptom-input" className="text-xs font-semibold text-emerald-300">
                  {t.charak.inputLabel}
                </label>
                <span className="text-[11px] text-emerald-100/50">{textInput.length} / 5000 chars</span>
              </div>
              <textarea
                id="symptom-input"
                className="w-full bg-[#04150E] border border-[#124731] rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-emerald-100/40 focus:outline-none focus:border-emerald-500/70 min-h-[130px] leading-relaxed transition-colors"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t.charak.placeholder}
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-emerald-300 block">
                {t.charak.quickExamples}
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SCENARIOS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTextInput(s.text);
                      handleSubmit(s.text);
                    }}
                    className="px-2.5 py-1 text-xs bg-[#04150E] hover:bg-[#0B2E20] hover:text-white text-emerald-100/80 rounded-lg border border-[#124731] transition-colors cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={submitting || !textInput.trim()}
                className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? t.charak.analyzing : t.charak.checkHealth}</span>
              </button>
              {textInput && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-3 rounded-xl text-xs font-semibold bg-[#04150E] hover:bg-[#0B2E20] text-emerald-300 border border-[#124731] transition-colors cursor-pointer"
                  title="Clear input"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {result && result.isGreeting && (
          <div className="bg-[#062016]/95 border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
                👋
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
                  {t.charak.greetingBadge}
                </span>
                <h2 className="text-xl font-serif font-bold text-white">
                  {result.greetingTitle || t.charak.greetingTitle}
                </h2>
                <p className="text-sm text-emerald-100/90 leading-relaxed mt-2">
                  {result.greetingMessage || t.charak.greetingDesc}
                </p>
              </div>

              {ttsSupported && (
                <button
                  type="button"
                  onClick={() => {
                    if (speaking) stopSpeaking();
                    else speak(result.greetingMessage || result.greetingTitle, { lang: langObj.locale });
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    speaking
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                      : 'bg-[#04150E] text-emerald-300 border-[#124731] hover:bg-[#0B2E20]'
                  }`}
                  title={speaking ? t.charak.stopAudio : t.charak.listenVoice}
                >
                  {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="p-4 bg-[#04150E] border border-[#124731] rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.charak.testPrompt}</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { title: '🍵 Mild Acidity', text: 'I have had continuous stomach burning and acidity after eating heavy dinner.' },
                  { title: '🩺 3-Day Fever', text: 'Persistent fever for 3 days with dry cough, throat pain, and body ache.' },
                  { title: '🚨 Crushing Chest Pain', text: 'Severe crushing chest pain radiating to left arm with difficulty breathing.' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTextInput(item.text);
                      handleSubmit(item.text);
                    }}
                    className="p-3 rounded-lg bg-[#062016] border border-[#124731] hover:border-emerald-500/50 text-left transition-colors cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-emerald-300">{item.title}</span>
                    <span className="text-[11px] text-emerald-100/60 line-clamp-2 mt-0.5">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-[#04150E] hover:bg-[#0B2E20] text-emerald-300 border border-[#124731] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.charak.startNew}</span>
              </button>
            </div>
          </div>
        )}

        {result && result.isGibberish && (
          <div className="bg-[#062016]/95 border-2 border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div className="space-y-1.5 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
                  {t.charak.gibberishBadge}
                </span>
                <h2 className="text-xl font-serif font-bold text-white">
                  {t.charak.gibberishTitle}
                </h2>
                <p className="text-sm text-emerald-100/90 leading-relaxed mt-2">
                  {t.charak.gibberishDesc}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#04150E] border border-[#124731] rounded-xl space-y-3">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.charak.testPrompt}</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { title: '🍵 Mild Acidity', text: 'I have had continuous stomach burning and acidity after eating heavy dinner.' },
                  { title: '🩺 3-Day Fever', text: 'Persistent fever for 3 days with dry cough, throat pain, and body ache.' },
                  { title: '🚨 Crushing Chest Pain', text: 'Severe crushing chest pain radiating to left arm with difficulty breathing.' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTextInput(item.text);
                      handleSubmit(item.text);
                    }}
                    className="p-3 rounded-lg bg-[#062016] border border-[#124731] hover:border-emerald-500/50 text-left transition-colors cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-white block group-hover:text-emerald-300">{item.title}</span>
                    <span className="text-[11px] text-emerald-100/60 line-clamp-2 mt-0.5">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-[#04150E] hover:bg-[#0B2E20] text-emerald-300 border border-[#124731] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.charak.startNew}</span>
              </button>
            </div>
          </div>
        )}

        {result && !result.isGreeting && !result.isGibberish && (
          <div className="space-y-4">
            <TriageCard
              dangerLevel={result.dangerLevel}
              verifiedAdvice={result.verifiedAdvice}
              requiresHumanReview={result.requiresHumanReview}
              status={result.status}
              caseId={result.caseId}
              lang={langObj.locale}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#062016] hover:bg-[#0B2E20] text-emerald-300 border border-[#124731] flex-1 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.charak.checkAnother}</span>
              </button>
              {result.dangerLevel === 'high' && (
                <button
                  type="button"
                  onClick={() => setSosActive(true)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex-1 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t.charak.viewSos}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
