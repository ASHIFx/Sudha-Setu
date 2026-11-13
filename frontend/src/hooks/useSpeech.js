import { useState, useRef, useCallback, useEffect } from 'react';

const getSpeechRecognitionAPI = () =>
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

const getSpeechSynthesisAPI = () =>
  typeof window === 'undefined' ? null : window.speechSynthesis || null;

/**
 * Detect language based on script / content (Devanagari vs Latin)
 */
export const detectLanguage = (text = '') => {
  if (!text) return 'hi-IN';
  // Check for Devanagari unicode range (Hindi / Sanskrit / Marathi)
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text) ? 'hi-IN' : 'en-IN';
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

  const recogRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const currentUtteranceRef = useRef(null);

  // Sync prop changes to currentLang
  useEffect(() => {
    if (lang) setCurrentLang(lang);
  }, [lang]);

  // STT Stop
  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  // STT Start
  const start = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) return;

    if (recogRef.current) {
      recogRef.current.abort();
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

    recog.start();
    recogRef.current = recog;
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

  // Text-To-Speech (TTS)
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

      synth.cancel(); // Stop any active speech

      const targetLang = options.lang || currentLang || detectLanguage(text);
      const cleanText = text.replace(/[*_#`[\]()]/g, ''); // strip markdown formatting for cleaner speech

      const utterance = new window.SpeechSynthesisUtterance(cleanText);
      utterance.lang = targetLang;
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      // Select matching voice if available
      const voices = synth.getVoices?.() || [];
      const matchVoice =
        voices.find((v) => v.lang === targetLang) ||
        voices.find((v) => v.lang.startsWith(targetLang.split('-')[0])) ||
        voices[0];

      if (matchVoice) {
        utterance.voice = matchVoice;
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
    [currentLang]
  );

  useEffect(() => {
    return () => {
      recogRef.current?.abort();
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
