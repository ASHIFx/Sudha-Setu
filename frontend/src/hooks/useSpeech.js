import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api.js';

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

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result;
      if (typeof res === 'string') {
        const base64 = res.includes('base64,') ? res.split('base64,')[1] : res;
        resolve(base64);
      } else {
        reject(new Error('Failed to encode audio'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function useSpeech({ lang = 'hi-IN', onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentLang, setCurrentLang] = useState(lang);
  const [transcript, setTranscript] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  const recogRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isListeningRef = useRef(false);
  const usingMediaRecorderRef = useRef(false);

  const supported = typeof window !== 'undefined' &&
    (!!getSpeechRecognitionAPI() || !!(window.navigator?.mediaDevices?.getUserMedia && window.MediaRecorder));

  const ttsSupported = typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  useEffect(() => {
    if (lang) {
      setCurrentLang(lang);
      if (recogRef.current) {
        recogRef.current.lang = lang;
      }
    }
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

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const sendAudioForAITranscription = useCallback(
    async (blob) => {
      try {
        setTranscribing(true);
        const base64 = await blobToBase64(blob);
        const { data } = await api.post('/ai/transcribe', {
          audioData: base64,
          mimeType: blob.type || 'audio/webm',
          language: currentLang,
        });

        if (data?.success && data.transcript && data.transcript.trim()) {
          const clean = data.transcript.trim();
          finalTranscriptRef.current = clean;
          setTranscript(clean);
          onResult?.(clean);
          toast.success('Speech transcribed with AI');
        } else if (data?.message) {
          toast.error(data.message);
        }
      } catch (err) {
        console.warn('[speech] AI transcription error:', err.message);
        toast.error('AI voice transcription unavailable. Please type your symptoms.');
      } finally {
        setTranscribing(false);
      }
    },
    [currentLang, onResult]
  );

  const startMediaRecorderFallback = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Microphone not supported on this device.');
      setListening(false);
      isListeningRef.current = false;
      return;
    }

    try {
      usingMediaRecorderRef.current = true;
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        cleanupStream();
        const type = audioChunksRef.current[0]?.type || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type });
        if (blob.size > 0) {
          sendAudioForAITranscription(blob);
        }
      };

      recorder.start(250);
      setListening(true);
      isListeningRef.current = true;
      toast('Listening… speak into your microphone', { icon: '🎙️' });
    } catch (err) {
      console.warn('[speech] getUserMedia failed:', err);
      toast.error('Please allow microphone permissions in browser settings.');
      setListening(false);
      isListeningRef.current = false;
      usingMediaRecorderRef.current = false;
    }
  }, [cleanupStream, sendAudioForAITranscription]);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    setListening(false);

    if (recogRef.current) {
      try {
        recogRef.current.stop();
      } catch {}
      recogRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    } else {
      cleanupStream();
    }
  }, [cleanupStream]);

  const start = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    isListeningRef.current = true;
    usingMediaRecorderRef.current = false;

    const SpeechRecognitionAPI = getSpeechRecognitionAPI();

    if (SpeechRecognitionAPI) {
      try {
        if (recogRef.current) {
          try {
            recogRef.current.abort();
          } catch {}
        }

        const recog = new SpeechRecognitionAPI();
        recog.lang = currentLang;
        recog.continuous = true;
        recog.interimResults = true;
        recog.maxAlternatives = 1;

        recog.onstart = () => {
          setListening(true);
          isListeningRef.current = true;
        };

        recog.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const item = event.results[i];
            const text = item[0]?.transcript || '';
            if (item.isFinal) {
              finalTranscriptRef.current += (finalTranscriptRef.current ? ' ' : '') + text.trim();
            } else {
              interim += text;
            }
          }
          const combined = (finalTranscriptRef.current + (interim ? ' ' + interim : '')).trim();
          if (combined) {
            setTranscript(combined);
            onResult?.(combined);
          }
        };

        recog.onerror = (e) => {
          console.warn('[speech] WebSpeech error:', e.error);
          if (e.error === 'not-allowed') {
            toast.error('Microphone access denied. Please allow microphone in browser settings.');
            stop();
          } else if (e.error === 'network' || e.error === 'service-not-allowed') {
            recog.abort();
            recogRef.current = null;
            startMediaRecorderFallback();
          }
        };

        recog.onend = () => {
          if (isListeningRef.current && !usingMediaRecorderRef.current) {
            try {
              recog.start();
            } catch {
              setListening(false);
              isListeningRef.current = false;
            }
          } else {
            setListening(false);
          }
        };

        recog.start();
        recogRef.current = recog;
        setListening(true);
        return;
      } catch (err) {
        console.warn('[speech] WebSpeech initialization failed, using recorder:', err);
      }
    }

    startMediaRecorderFallback();
  }, [currentLang, onResult, stop, startMediaRecorderFallback]);

  const toggle = useCallback(() => {
    if (listening || isListeningRef.current) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  const reset = useCallback(() => {
    stop();
    finalTranscriptRef.current = '';
    setTranscript('');
    audioChunksRef.current = [];
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

      synth.speak(utterance);
    },
    [availableVoices, currentLang]
  );

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      recogRef.current?.abort?.();
      cleanupStream();
      const synth = getSpeechSynthesisAPI();
      if (synth) synth.cancel();
    };
  }, [cleanupStream]);

  return {
    listening,
    transcribing,
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
