import { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Mic, MicOff, Send, RotateCcw } from 'lucide-react';
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
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded">
      <div>
        <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          {listening ? 'Voice Recording in Progress' : 'Voice Input Capture'}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {listening
            ? 'Speak clearly into your microphone in your chosen language.'
            : 'Click the microphone button to transcribe symptoms automatically.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded text-xs font-bold transition-colors flex items-center gap-2 ${
          listening
            ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse'
            : 'bg-teal-800 hover:bg-teal-900 text-white'
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
    <>
      {sosActive && result && (
        <SosOverlay caseId={result.caseId} onDismiss={() => setSosActive(false)} />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Patient Clinical Pre-Consultation Station
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: <span className="font-semibold text-slate-800">{user?.name || 'Anonymous Intake'}</span> • ABHA: <span className="font-mono text-slate-700">{user?.abhaId || 'Unlinked'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Language:</span>
            {LANGUAGE_OPTIONS.map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => { setLang(l.value); reset(); setTextInput(''); }}
                className={`px-3 py-1 text-xs font-semibold rounded border transition-colors ${
                  lang === l.value
                    ? 'bg-teal-800 text-white border-teal-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {!result && (
          <div className="bg-white border border-slate-200 rounded p-6 shadow-xs space-y-5">
            {supported ? (
              <AudioCaptureBar listening={listening} onClick={toggle} disabled={submitting} />
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded">
                Voice input is not supported in this browser environment. Please describe symptoms using the text console below.
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="symptom-text" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Describe Clinical Symptoms / लक्षण विवरण
                </label>
                <span className="text-[11px] text-slate-400">{textInput.length} / 5000 chars</span>
              </div>
              <textarea
                id="symptom-text"
                className="w-full text-xs sm:text-sm p-3 rounded border border-slate-300 min-h-[140px] resize-y focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 leading-relaxed font-normal"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  lang === 'hi-IN'
                    ? 'उदाहरण: मुझे पिछले दो दिनों से तेज बुखार है, सिर में लगातार दर्द हो रहा है और गले में खराश है...'
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
                className="flex-1 py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Running Clinical Triage…' : 'Submit for Clinical Triage'}</span>
              </button>
              {textInput && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
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
                className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Begin Another Assessment</span>
              </button>
              {result.dangerLevel === 'high' && (
                <button
                  type="button"
                  onClick={() => setSosActive(true)}
                  className="flex-1 py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold transition-colors"
                >
                  View Active Emergency SOS
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
