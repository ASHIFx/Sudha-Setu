import { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Mic, MicOff, Send, RotateCcw, Globe, Loader2, Sparkles, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import useSpeech from '../../hooks/useSpeech.js';
import TriageCard from '../../components/ui/TriageCard.jsx';
import SosOverlay from '../../components/ui/SosOverlay.jsx';

const LANGUAGE_OPTIONS = [
  { value: 'hi-IN', label: 'हिन्दी (Hindi)', api: 'hi' },
  { value: 'en-IN', label: 'English (India)', api: 'en' },
];

function MicButton({ listening, onClick, disabled }) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={listening ? 'Stop recording' : 'Start recording'}
        className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-offset-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
          ${listening
            ? 'bg-red-500 hover:bg-red-600 text-white mic-pulse ring-4 ring-red-200'
            : 'bg-brand-600 hover:bg-brand-700 text-white hover:scale-105 active:scale-95 shadow-brand-500/25'
          }`}
      >
        {listening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
      </button>
      <p className="mt-3 text-xs font-semibold tracking-wide uppercase text-slate-500">
        {listening ? <span className="text-red-600 animate-pulse">● Listening now…</span> : 'Tap to speak'}
      </p>
    </div>
  );
}

export default function IntakePage() {
  const user = useSelector((s) => s.auth.user);
  
  const [lang, setLang] = useState(() => {
    const pref = user?.languagePreference?.toLowerCase();
    if (pref === 'en' || pref === 'en-in') return 'en-IN';
    return 'hi-IN';
  });

  const [textInput, setTextInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const locationRef = useRef(null);

  const onSpeechResult = useCallback((transcript) => {
    setTextInput(transcript);
  }, []);

  const { listening, supported, toggle, reset } = useSpeech({
    lang,
    onResult: onSpeechResult,
  });

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });

  const handleSubmit = async () => {
    const text = textInput.trim();
    if (!text) {
      toast.error('Please describe your symptoms before submitting.');
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      if (!locationRef.current) {
        locationRef.current = await getLocation();
      }
      const selectedLang = LANGUAGE_OPTIONS.find((l) => l.value === lang);
      const { data } = await api.post('/cases/intake', {
        patientText: text,
        languageUsed: selectedLang?.api ?? 'hi',
        location: locationRef.current ?? undefined,
      });
      setResult(data);
      if (data.emergency || data.dangerLevel === 'high') {
        setSosActive(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Triage failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setTextInput('');
    setResult(null);
    setSosActive(false);
    locationRef.current = null;
  };

  return (
    <>
      {sosActive && result && (
        <SosOverlay caseId={result.caseId} onDismiss={() => setSosActive(false)} />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" /> AI Ayurvedic Pre-Consultation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            नमस्ते, {user?.name?.split(' ')[0] ?? 'Patient'} 🙏
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
            Speak or type your symptoms. Our clinical engine will triage your condition and connect you to care.
          </p>
        </div>

        {!result && (
          <div className="card shadow-lg border-slate-200/80 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Select Input Language</p>
                <p className="text-xs text-slate-400">भाषा चुनें (Speech recognition adapts to choice)</p>
              </div>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => { setLang(l.value); reset(); setTextInput(''); }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      lang === l.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              {supported ? (
                <MicButton listening={listening} onClick={toggle} disabled={submitting} />
              ) : (
                <div className="text-center px-4 py-2 text-xs text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                  Voice input not supported in this browser. Please use text input below.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="symptom-text" className="label text-sm font-semibold">
                  Or Describe Symptoms in Text
                </label>
                <span className="text-[11px] text-slate-400">{textInput.length} / 5000 characters</span>
              </div>
              <textarea
                id="symptom-text"
                className="input min-h-[110px] resize-y text-sm leading-relaxed"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={lang === 'hi-IN'
                  ? 'उदाहरण: मुझे 2 दिनों से तेज बुखार है, ठंड लग रही है, और सिर में भारी दर्द है...'
                  : 'e.g. I have had a continuous fever for two days with shivering and severe headache...'}
                disabled={submitting}
                maxLength={5000}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !textInput.trim()}
                className="btn-primary flex-1 py-3 text-sm sm:text-base font-semibold shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Running Triage Assessment…' : 'Submit for Triage'}
              </button>
              {textInput && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-ghost px-3.5 py-3 text-slate-500 hover:text-slate-700"
                  aria-label="Clear input"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <TriageCard
              dangerLevel={result.dangerLevel}
              verifiedAdvice={result.verifiedAdvice}
              requiresHumanReview={result.requiresHumanReview}
              status={result.status}
              caseId={result.caseId}
              lang={lang}
            />
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Start a New Assessment
              </button>
              {result.dangerLevel === 'high' && (
                <button
                  type="button"
                  onClick={() => setSosActive(true)}
                  className="btn-danger flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  🚨 View Emergency SOS Status
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
