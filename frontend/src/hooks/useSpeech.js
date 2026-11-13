import { useState, useRef, useCallback, useEffect } from 'react';

const getSpeechRecognitionAPI = () =>
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

const getSpeechSynthesisAPI = () =>
  typeof window === 'undefined' ? null : window.speechSynthesis || null;

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', locale: 'hi-IN', label: 'हिन्दी (Hindi)', greeting: 'नमस्ते, आप कैसा महसूस कर रहे हैं?' },
  { code: 'en', locale: 'en-IN', label: 'English (India)', greeting: 'Hello, how can I assist you with your health today?' },
  { code: 'bn', locale: 'bn-IN', label: 'বাংলা (Bengali)', greeting: 'নমস্কার, আজ আপনি কেমন বোধ করছেন?' },
  { code: 'mr', locale: 'mr-IN', label: 'मराठी (Marathi)', greeting: 'नमस्कार, आज तुम्हाला कसे वाटत आहे?' },
  { code: 'ta', locale: 'ta-IN', label: 'தமிழ் (Tamil)', greeting: 'வணக்கம், இன்று உங்கள் உடல்நலம் எவ்வாறு உள்ளது?' },
];

export const detectLanguage = (text = '') => {
  if (!text) return 'hi-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
  return 'en-IN';
};

export default function useSpeech({ lang = 'hi-IN', onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentLang, setCurrentLang] = useState(lang);
  const [supported] = useState(() => !!getSpeechRecognitionAPI());
  const [ttsSupported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  );
  const [transcript, setTranscript] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  const recogRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const currentUtteranceRef = useRef(null);

  useEffect(() => {
    if (lang) setCurrentLang(lang);
  }, [lang]);

  useEffect(() => {
    const synth = getSpeechSynthesisAPI();
    if (!synth) return;
    const updateVoices = () => {
      const v = synth.getVoices() || [];
      if (v.length > 0) setAvailableVoices(v);
    };
    updateVoices();
    synth.onvoiceschanged = updateVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  const stop = useCallback(() => {
    try {
      recogRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) return;

    if (recogRef.current) {
      try {
        recogRef.current.abort();
      } catch {}
    }

    finalTranscriptRef.current = '';

    const recog = new SpeechRecognitionAPI();
    recog.lang = currentLang;
    recog.interimResults = true;
    recog.continuous = true;
    recog.maxAlternatives = 1;

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);

    recog.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += t + ' ';
        } else {
          interim += t;
        }
      }
      const display = (finalTranscriptRef.current + interim).trim();
      setTranscript(display);
      onResult?.(display);
    };

    recog.onerror = (e) => {
      if (e.error !== 'aborted') console.warn('[speech] recognition error:', e.error);
      setListening(false);
    };

    try {
      recog.start();
      recogRef.current = recog;
    } catch (err) {
      console.warn('[speech] recog.start failed:', err);
    }
  }, [currentLang, onResult]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  const reset = useCallback(() => {
    stop();
    finalTranscriptRef.current = '';
    setTranscript('');
  }, [stop]);

  const stopSpeaking = useCallback(() => {
    const synth = getSpeechSynthesisAPI();
    if (synth) {
      synth.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      const synth = getSpeechSynthesisAPI();
      if (!synth || !text) return;

      synth.cancel();

      const targetLang = options.lang || currentLang || detectLanguage(text);
      const cleanText = text.replace(/[*_#`[\]()]/g, '');

      const utterance = new window.SpeechSynthesisUtterance(cleanText);
      utterance.lang = targetLang;
      utterance.rate = options.rate ?? 0.88;
      utterance.pitch = options.pitch ?? 1.08;
      utterance.volume = options.volume ?? 0.85;

      const voices = availableVoices.length > 0 ? availableVoices : synth.getVoices?.() || [];
      const langPrefix = targetLang.split('-')[0].toLowerCase();
      const langMatches = voices.filter(
        (v) => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.toLowerCase().startsWith(langPrefix)
      );

      const femalePatterns = /swara|heera|neerja|kalpana|geeta|shruti|ananya|priya|zira|samantha|victoria|karen|jenny|aria|female|girl|google.*female/i;
      const malePatterns = /male|david|mark|ravi|george|madhav|hemant|guy|stefan/i;

      const softFemaleVoice =
        langMatches.find((v) => femalePatterns.test(v.name) && !malePatterns.test(v.name)) ||
        langMatches.find((v) => !malePatterns.test(v.name)) ||
        voices.find((v) => femalePatterns.test(v.name) && !malePatterns.test(v.name)) ||
        langMatches[0] ||
        voices[0];

      if (softFemaleVoice) {
        utterance.voice = softFemaleVoice;
      }

      utterance.onstart = () => {
        setSpeaking(true);
        options.onStart?.();
      };

      utterance.onend = () => {
        setSpeaking(false);
        options.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.warn('[speech] synthesis error:', e.error);
        setSpeaking(false);
        options.onError?.(e);
      };

      currentUtteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [availableVoices, currentLang]
  );

  useEffect(() => {
    return () => {
      recogRef.current?.abort?.();
      const synth = getSpeechSynthesisAPI();
      if (synth) synth.cancel();
    };
  }, []);

  return {
    listening,
    speaking,
    supported,
    ttsSupported,
    transcript,
    currentLang,
    setCurrentLang,
    start,
    stop,
    toggle,
    reset,
    speak,
    stopSpeaking,
  };
}