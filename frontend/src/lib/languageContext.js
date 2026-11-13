import { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, getTranslation } from './translations.js';

const STORAGE_KEY = 'sudha_setu_active_lang';
const listeners = new Set();

export const getSavedLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(STORAGE_KEY) || 'en';
};

export const setGlobalLanguage = (langCode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, langCode);
  }
  listeners.forEach((fn) => fn(langCode));
};

export const useAppLanguage = () => {
  const [langCode, setLangCode] = useState(getSavedLanguage);

  useEffect(() => {
    const handler = (newCode) => setLangCode(newCode);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const changeLanguage = (newCode) => {
    setGlobalLanguage(newCode);
  };

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === langCode) || SUPPORTED_LANGUAGES[1];
  const t = getTranslation(langCode);

  return {
    langCode,
    langObj: currentLangObj,
    t,
    changeLanguage,
  };
};
