import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function useSpeech({ lang = 'hi-IN', onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => !!SpeechRecognitionAPI);
  const [transcript, setTranscript] = useState('');
  const recogRef = useRef(null);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) return;

    if (recogRef.current) {
      recogRef.current.abort();
    }

    const recog = new SpeechRecognitionAPI();
    recog.lang = lang;
    recog.interimResults = true;
    recog.continuous = true;
    recog.maxAlternatives = 1;

    recog.onstart = () => setListening(true);
    recog.onend = () => setListening(false);

    recog.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      const combined = final || interim;
      setTranscript((prev) => {
        const updated = (prev + ' ' + combined).trim();
        onResult?.(updated);
        return updated;
      });
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
    setTranscript('');
  }, [stop]);

  useEffect(() => {
    return () => recogRef.current?.abort();
  }, []);

  return { listening, supported, transcript, start, stop, toggle, reset };
}
