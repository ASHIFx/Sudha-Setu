import { useState, useRef, useCallback, useEffect } from 'react';

const getSpeechRecognitionAPI = () =>
  typeof window === 'undefined'
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function useSpeech({ lang = 'hi-IN', onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!getSpeechRecognitionAPI());
  const [transcript, setTranscript] = useState('');
  const recogRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();
    if (!SpeechRecognitionAPI) return;

    if (recogRef.current) {
      recogRef.current.abort();
    }

    finalTranscriptRef.current = '';

    const recog = new SpeechRecognitionAPI();
    recog.lang = lang;
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
      if (e.error !== 'aborted') console.warn('[speech]', e.error);
      setListening(false);
    };

    recog.start();
    recogRef.current = recog;
  }, [lang, onResult]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  const reset = useCallback(() => {
    stop();
    finalTranscriptRef.current = '';
    setTranscript('');
  }, [stop]);

  useEffect(() => {
    return () => recogRef.current?.abort();
  }, []);

  return { listening, supported, transcript, start, stop, toggle, reset };
}
