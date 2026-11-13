import { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Mic, MicOff, Send, RotateCcw, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import useSpeech from '../../hooks/useSpeech.js';
import TriageCard from '../../components/ui/TriageCard.jsx';
import SosOverlay from '../../components/ui/SosOverlay.jsx';

const LANGUAGE_OPTIONS = [
  { value: 'hi-IN', label: 'हिन्दी (Hindi)', api: 'hi' },
  { value: 'en-IN', label: 'English (India)', api: 'en' },
];

function AudioCaptureBar({ listening, onClick, disabled }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl">
      <div>
        <p className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
          {listening && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          <span>{listening ? 'Voice Recording in Progress' : 'Voice Input Transcription'}</span>
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {listening
            ? 'Speaking now. Tap Stop Recording when finished.'
            : 'Tap the mic to describe your symptoms in Hindi or English.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
          listening
            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-lg shadow-rose-600/30'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20'
        }`}
      >
        {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        <span>{listening ? 'Stop Recording' : 'Start Voice Input'}</span>
      </button>
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
      const msg = err.response?.data?.message ?? 'Triage assessment failed. Please try again.';
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
    <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)]">
      {sosActive && result && (
        <SosOverlay caseId={result.caseId} onDismiss={() => setSosActive(false)} />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Interactive Assessment</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Patient Health Intake & Triage
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Patient: <span className="font-semibold text-slate-200">{user?.name || 'Guest'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Language:</span>
            {LANGUAGE_OPTIONS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => { setLang(l.value); reset(); setTextInput(''); }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  lang === l.value
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {!result && (
          <div className="card space-y-5">
            {supported ? (
              <AudioCaptureBar listening={listening} onClick={toggle} disabled={submitting} />
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-lg">
                Voice input is not supported in this browser environment. Please describe symptoms using the text console below.
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="symptom-text" className="label !mb-0">
                  Describe Symptoms / लक्षण विवरण
                </label>
                <span className="text-[11px] text-slate-500">{textInput.length} / 5000 chars</span>
              </div>
              <textarea
                id="symptom-text"
                className="input min-h-[140px] resize-y leading-relaxed"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  lang === 'hi-IN'
                    ? 'उदाहरण: मुझे पिछले दो दिनों से तेज बुखार है, सिर में लगातार भारी दर्द है और गले में खराश है...'
                    : 'e.g. I have had continuous high fever for two days with severe headache and throat irritation...'
                }
                disabled={submitting}
                maxLength={5000}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !textInput.trim()}
                className="btn-primary flex-1 py-2.5 text-xs font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Analyzing Symptoms…' : 'Submit for Triage'}</span>
              </button>
              {textInput && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary px-3 py-2 text-xs"
                  title="Clear input"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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
                className="btn-secondary flex-1 py-2.5 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Begin Another Assessment</span>
              </button>
              {result.dangerLevel === 'high' && (
                <button
                  type="button"
                  onClick={() => setSosActive(true)}
                  className="btn-danger flex-1 py-2.5 text-xs font-bold"
                >
                  View Active Emergency SOS
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
