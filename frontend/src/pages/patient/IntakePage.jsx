import { useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Mic, MicOff, Send, RotateCcw, Globe, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import useSpeech from '../../hooks/useSpeech.js';
import TriageCard from '../../components/ui/TriageCard.jsx';
import SosOverlay from '../../components/ui/SosOverlay.jsx';

const LANGUAGE_OPTIONS = [
  { value: 'hi-IN', label: 'हिन्दी', api: 'hi' },
  { value: 'en-IN', label: 'English', api: 'en' },
];

function MicButton({ listening, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={listening ? 'Stop recording' : 'Start recording'}
      className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-200 focus-visible:ring-4 focus-visible:ring-offset-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl
        ${listening
          ? 'bg-red-500 hover:bg-red-600 text-white mic-pulse focus-visible:ring-red-400'
          : 'bg-brand-600 hover:bg-brand-700 text-white focus-visible:ring-brand-400 active:scale-95'
        }`}
    >
      {listening ? <MicOff className="w-14 h-14" /> : <Mic className="w-14 h-14" />}
      {listening && (
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-semibold text-red-600 whitespace-nowrap">
          Listening…
        </span>
      )}
    </button>
  );
}

export default function IntakePage() {
  const user = useSelector((s) => s.auth.user);
  const [lang, setLang] = useState('hi-IN');
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
  };

  return (
    <>
      {sosActive && result && (
        <SosOverlay caseId={result.caseId} onDismiss={() => setSosActive(false)} />
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900">
            नमस्ते, {user?.name?.split(' ')[0] ?? 'Patient'} 🙏
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Tell us your symptoms by voice or text. Our AI will assess your condition instantly.
          </p>
        </div>

        {!result && (
          <div className="card space-y-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-700">Choose Language / भाषा चुनें</p>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => { setLang(l.value); reset(); setTextInput(''); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      lang === l.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 py-4">
              {supported ? (
                <>
                  <MicButton listening={listening} onClick={toggle} disabled={submitting} />
                  <p className="text-sm text-slate-400">
                    {listening ? 'Tap mic to stop' : 'Tap the microphone and speak your symptoms'}
                  </p>
                </>
              ) : (
                <div className="text-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  Voice input is not supported in this browser. Please use the text field below.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="symptom-text" className="label text-base">
                Or type your symptoms here / यहाँ लिखें
              </label>
              <textarea
                id="symptom-text"
                className="input min-h-[120px] resize-y text-base leading-relaxed"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={lang === 'hi-IN'
                  ? 'उदाहरण: मुझे दो दिनों से तेज बुखार है, सिरदर्द है और गले में दर्द है।'
                  : 'e.g. I have had high fever for two days, headache, and a sore throat.'}
                disabled={submitting}
                maxLength={5000}
              />
              <p className="text-xs text-slate-400 text-right">{textInput.length} / 5000</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting || !textInput.trim()}
                className="btn-primary flex-1 py-4 text-lg"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Analysing…' : 'Submit for Triage'}
              </button>
              {textInput && (
                <button
                  onClick={handleReset}
                  className="btn-ghost px-4 py-4"
                  aria-label="Clear input"
                >
                  <RotateCcw className="w-5 h-5" />
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
            />
            <button onClick={handleReset} className="btn-ghost w-full py-3 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Start a New Assessment
            </button>
            {result.dangerLevel === 'high' && (
              <button onClick={() => setSosActive(true)} className="btn-danger w-full py-3 text-base">
                🚨 Re-open Emergency Alert
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
