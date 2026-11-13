import mongoose from 'mongoose';
import KnowledgeBase, { DANGER_LEVELS } from '../models/KnowledgeBase.js';
import { assessSymptomWithLLM } from './aiService.js';
import { retrieveRelevantKnowledge } from './ragService.js';

export const LOW_CONFIDENCE_THRESHOLD = 0.55;

const LEVEL_RANK = { low: 1, medium: 2, high: 3 };

const GREETING_PATTERN = /^(hi+|hlw|hlo|helo|hello+|hey+|heyy+|hy+|haai|hie|hiya|yo|wassup|what'?s\s*up|sup|namaste|namaskar|namaskara|pranam|pranaam|vanakkam|kemon\s*acho|kem\s*cho|radhe\s*radhe|ram\s*ram|jai\s*shri\s*krishna|salaam|salam|adaab|good\s*(morning|evening|afternoon|day)|hola|kya\s*haal|kaise\s*ho|how\s*are\s*you|how\s*r\s*u|kaisa\s*hai|kaisi\s*hai)(\s+(there|doctor|doc|ji|bhai|sir|mam|madam|friend|charak|vaani|team|everyone))?[\s!.,?]*$/i;

const isGreetingText = (str = '') => {
  const clean = str.trim();
  if (!clean) return true;
  return GREETING_PATTERN.test(clean);
};

const MEDICAL_WHITELIST = /\b(fever|pain|ache|cold|cough|vomit|diarrhea|rash|itch|chills|dizzy|nausea|burn|gas|acidity|headache|stomach|throat|chest|breath|breathing|infection|bleed|bleeding|injury|swelling|cramp|cramps|constipation|piles|bp|sugar|pressure|heart|weakness|tired|fatigue|sleep|insomnia|allergy|flu|dengue|malaria|covid|asthma|ulcer|boil|wound|bukhar|dard|khansi|sar dard|pet dard|gale me|sardi|ulti|dast|jalan|chakkar|kamzori|khujli)\b/i;

const isGibberishText = (str = '') => {
  const clean = str.trim();
  if (clean.length < 2) return true;
  if (isGreetingText(clean)) return false;
  if (MEDICAL_WHITELIST.test(clean)) return false;
  if (/^[\d\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(clean)) return true;
  if (/(qwerty|asdfgh|zxcvbn|12345|67890|poiuy|lkjhg|mnbvc)/i.test(clean)) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(clean)) return true;
  if (/(.)\1{3,}/.test(clean)) return true;
  if (clean.length > 5 && new Set(clean.toLowerCase().replace(/[^a-z0-9]/g, '')).size <= 2) return true;
  if (/^(test|testing|sample|check|checking|blah|random)(\s+(test|testing|sample|check|blah|random))*$/i.test(clean)) return true;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 3 && words.every((w) => /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(w) || w.length > 12)) return true;
  return false;
};

const NEGATIONS = ['no', 'not', 'never', 'without', 'denies', 'nahi', 'nahin', 'नहीं', 'नही'];

const hasNegation = (text, idx) => {
  const prefix = text.slice(Math.max(0, idx - 30), idx).toLowerCase();
  return NEGATIONS.some((n) => prefix.includes(n));
};

const GREETING_RESPONSES = {
  hi: {
    greetingTitle: 'नमस्ते! यह कोई बीमारी या समस्या नहीं है',
    message: 'नमस्ते! मैं आपकी चरक वाणी स्वास्थ्य सहायिका हूँ। यह एक सामान्य अभिवादन लग रहा है, कोई रोग या बीमारी नहीं। आज आप कैसा महसूस कर रहे हैं? यदि आपको कोई शारीरिक परेशानी या लक्षण हैं (जैसे सिरदर्द, बुखार, या पेट में दर्द), तो कृपया मुझे बताएं।',
    generalTips: [
      'नमस्ते! आपकी चरक वाणी स्वास्थ्य सहायिका तैयार है।',
      'कृपया अपने लक्षण (जैसे बुखार, सिरदर्द, या पेट में गैस) बताएं।',
    ],
    ayurvedicDietaryNotes: [
      'दिनभर गुनगुना पानी पिएं जिससे पाचन अग्नि संतुलित रहे।',
      'हल्का, ताजा और सुपाच्य भोजन ग्रहण करें।',
    ],
    safeRemedies: [
      'अपने लक्षण विस्तार से बताएं ताकि सही आयुर्वेदिक सलाह दी जा सके।',
    ],
  },
  bn: {
    greetingTitle: 'নমস্কার! এটি কোনো রোগ বা অসুস্থতা নয়',
    message: 'নমস্কার! আমি চরক বাণী, আপনার স্বাস্থ্য সহকারী। এটি কোনো রোগ নয়, একটি সুন্দর শুভেচ্ছা! আপনি আজ কেমন বোধ করছেন? যদি আপনার কোনো শারীরিক সমস্যা বা উপসর্গ থাকে (যেমন জ্বর, পেটে অস্বস্তি বা মাথা ব্যথা), দয়া করে জানান।',
    generalTips: [
      'নমস্কার! চরক বাণী স্বাস্থ্য পরামর্শের জন্য প্রস্তুত।',
      'আপনার শারীরিক লক্ষণ বা অস্বস্তির কথা জানান।',
    ],
    ayurvedicDietaryNotes: [
      'হজম ভালো রাখার জন্য সারা দিন কুসুম গরম জল পান করুন।',
      'তাজা ও সহজে হজম হয় এমন পুষ্টিকর খাবার খান।',
    ],
    safeRemedies: [
      'আপনার উপসর্গ বিস্তারিত লিখুন বা বলুন।',
    ],
  },
  mr: {
    greetingTitle: 'नमस्कार! हे आजारपण नाही, एक अभिवादन आहे',
    message: 'नमस्कार! मी चरक वाणी, तुमची आरोग्य सहाय्यक. हे एक सामान्य अभिवादन आहे, कोणताही आजार नाही! आज तुम्हाला कसे वाटत आहे? जर तुम्हाला काही शारीरिक त्रास किंवा लक्षणे असतील (जसे डोकेदुखी, ताप किंवा अपचन), तर कृपया सांगा.',
    generalTips: [
      'नमस्कार! चरक वाणी सहाय्यक आपल्या मदतीसाठी तत्पर आहे.',
      'कृपया तुमची लक्षणे (उदा. ताप, खोकला, अंगदुखी) सांगा.',
    ],
    ayurvedicDietaryNotes: [
      'पचनक्रिया सुरळीत राहण्यासाठी दिवसभर कोमट पाणी प्या.',
      'हलका आणि पचायला सोपा असलेला ताजा आहार घ्या.',
    ],
    safeRemedies: [
      'योग्य मार्गदर्शनासाठी तुमचे लक्षण सविस्तर सांगा.',
    ],
  },
  ta: {
    greetingTitle: 'வணக்கம்! இது எந்த நோயும் இல்லை, ஒரு வாழ்த்து மட்டுமே',
    message: 'வணக்கம்! நான் சரக் வாணி, உங்கள் நல உதவியாளர். இது ஒரு நலம் விசாரிக்கும் வாழ்த்து மட்டுமே, நோய் அல்ல! இன்று நீங்கள் எப்படி உணர்கிறீர்கள்? உங்களுக்கு ஏதேனும் உடல் உபாதைகள் அல்லது அறிகுறிகள் இருந்தால் (தலைவலி, காய்ச்சல் போன்றவை) தயவுசெய்து கூறவும்.',
    generalTips: [
      'வணக்கம்! சரக் வாணி உங்கள் நலனுக்கு உதவ தயார்.',
      'உங்கள் அறிகுறிகளை (காய்ச்சல், வலி போன்றவை) விவரிக்கவும்.',
    ],
    ayurvedicDietaryNotes: [
      'செரிமானத்தை காக்க நாள் முழுவதும் மிதமான வெந்நீர் அருந்தவும்.',
      'எளிதில் செரிக்கும் சத்தான உணவுகளை உண்ணுங்கள்.',
    ],
    safeRemedies: [
      'சரியான ஆலோசனைக்கு உங்கள் அறிகுறிகளை விவரமாக பகிரவும்.',
    ],
  },
  en: {
    greetingTitle: 'Hello! This is a friendly greeting, not a disease',
    message: 'Hello! I am Charak Vaani, your health companion. That sounds like a friendly greeting rather than a medical symptom! How are you feeling today? Please describe any symptoms, how long you have had them, or any discomfort (for example: "I have had a mild headache since yesterday").',
    generalTips: [
      'Hello! Charak Vaani health assistant is active and ready to assist you.',
      'Please describe how you feel or any symptoms you are experiencing.',
    ],
    ayurvedicDietaryNotes: [
      'Sip warm boiled water throughout the day to support your digestive fire.',
      'Enjoy freshly prepared, light meals suited to your current appetite.',
    ],
    safeRemedies: [
      'Mention your symptoms for personalized Ayurvedic guidance.',
    ],
  },
};

const defaultSelfCareAdvice = (lang = 'en') => {
  const selected = GREETING_RESPONSES[lang] || GREETING_RESPONSES.en;
  return {
    generalTips: selected.generalTips,
    ayurvedicDietaryNotes: selected.ayurvedicDietaryNotes,
    safeRemedies: selected.safeRemedies,
  };
};

export const analyzeSymptoms = async (patientText, languageUsed = 'en') => {
  const text = String(patientText || '').trim();
  const normalizedLang = ['hi', 'bn', 'mr', 'ta'].includes(languageUsed?.toLowerCase()) ? languageUsed.toLowerCase() : 'en';

  if (!text) {
    const greetingData = GREETING_RESPONSES[normalizedLang] || GREETING_RESPONSES.en;
    return {
      dangerLevel: 'low',
      confidenceScore: 0.98,
      isGreeting: true,
      greetingTitle: greetingData.greetingTitle,
      greetingMessage: greetingData.message,
      verifiedAdvice: {
        generalTips: greetingData.generalTips,
        ayurvedicDietaryNotes: greetingData.ayurvedicDietaryNotes,
        safeRemedies: greetingData.safeRemedies,
      },
      matchedKeywords: [],
      matchedRuleIds: [],
      requiresHumanReview: false,
      reason: 'empty_input',
    };
  }

  if (isGreetingText(text)) {
    const greetingData = GREETING_RESPONSES[normalizedLang] || GREETING_RESPONSES.en;
    return {
      dangerLevel: 'low',
      confidenceScore: 0.98,
      isGreeting: true,
      greetingTitle: greetingData.greetingTitle,
      greetingMessage: greetingData.message,
      verifiedAdvice: {
        generalTips: greetingData.generalTips,
        ayurvedicDietaryNotes: greetingData.ayurvedicDietaryNotes,
        safeRemedies: greetingData.safeRemedies,
      },
      matchedKeywords: [],
      matchedRuleIds: [],
      requiresHumanReview: false,
      reason: 'conversational_greeting',
    };
  }

  if (isGibberishText(text)) {
    return {
      dangerLevel: 'low',
      confidenceScore: 0.1,
      isGibberish: true,
      requiresHumanReview: false,
      reason: 'unintelligible_gibberish',
      verifiedAdvice: {
        generalTips: ['Please describe actual physical health symptoms (e.g. fever, headache, stomach pain) so Charak Vaani can assist you properly.'],
        ayurvedicDietaryNotes: [],
        safeRemedies: [],
      },
      matchedKeywords: [],
      matchedRuleIds: [],
    };
  }

  const ragRules = await retrieveRelevantKnowledge(text, 4).catch(() => []);

  const lowerText = text.toLowerCase();
  const rules = mongoose.connection.readyState === 1
    ? await KnowledgeBase.find({ active: true }).lean().catch(() => [])
    : [];

  const matches = [];
  for (const rule of rules) {
    const hits = [];
    for (const keyword of rule.keywordTriggers || []) {
      const kw = keyword.toLowerCase().trim();
      const idx = lowerText.indexOf(kw);
      if (idx !== -1 && !hasNegation(lowerText, idx)) {
        hits.push(keyword);
      }
    }
    if (hits.length > 0) {
      matches.push({ rule, hits });
    }
  }

  const llmResult = await assessSymptomWithLLM(text, languageUsed, ragRules);

  if (llmResult) {
    if (llmResult.isGibberish) {
      return {
        dangerLevel: 'low',
        confidenceScore: 0.1,
        isGibberish: true,
        requiresHumanReview: false,
        reason: 'unintelligible_gibberish',
        verifiedAdvice: {
          generalTips: ['Please describe actual health symptoms so Charak Vaani can assist you properly.'],
          ayurvedicDietaryNotes: [],
          safeRemedies: [],
        },
        matchedKeywords: [],
        matchedRuleIds: [],
      };
    }

    if (llmResult.isGreeting) {
      const greetingData = GREETING_RESPONSES[normalizedLang] || GREETING_RESPONSES.en;
      return {
        dangerLevel: 'low',
        confidenceScore: 0.98,
        isGreeting: true,
        greetingTitle: greetingData.greetingTitle,
        greetingMessage: greetingData.message,
        verifiedAdvice: {
          generalTips: greetingData.generalTips,
          ayurvedicDietaryNotes: greetingData.ayurvedicDietaryNotes,
          safeRemedies: greetingData.safeRemedies,
        },
        matchedKeywords: [],
        matchedRuleIds: [],
        requiresHumanReview: false,
        reason: 'conversational_greeting',
      };
    }

    let finalDanger = llmResult.dangerLevel;
    if (matches.some((m) => m.rule.dangerClassification === 'high')) {
      finalDanger = 'high';
    }

    const matchedKeywords = [...new Set(matches.flatMap((m) => m.hits))];
    const matchedRuleIds = matches.map((m) => String(m.rule._id));

    return {
      dangerLevel: finalDanger,
      confidenceScore: llmResult.confidenceScore,
      clinicalSummary: llmResult.clinicalSummary,
      verifiedAdvice: llmResult.verifiedAdvice,
      matchedKeywords,
      matchedRuleIds,
      requiresHumanReview: finalDanger !== 'low' || llmResult.requiresHumanReview,
      reason: 'rag_llm_triage',
    };
  }

  if (matches.length > 0) {
    let highestLevel = 'low';
    for (const m of matches) {
      if (LEVEL_RANK[m.rule.dangerClassification] > LEVEL_RANK[highestLevel]) {
        highestLevel = m.rule.dangerClassification;
      }
    }

    const winningMatches = matches.filter((m) => m.rule.dangerClassification === highestLevel);
    const matchedKeywords = [...new Set(winningMatches.flatMap((m) => m.hits))];
    const matchedRuleIds = winningMatches.map((m) => String(m.rule._id));

    const confidenceScore = Math.min(0.95, 0.6 + matchedKeywords.length * 0.1);
    const requiresHumanReview = highestLevel !== 'low' || confidenceScore < LOW_CONFIDENCE_THRESHOLD;

    const adviceLists = { generalTips: [], ayurvedicDietaryNotes: [], safeRemedies: [] };
    for (const m of winningMatches) {
      if (m.rule.verifiedAdvice) {
        adviceLists.generalTips.push(...(m.rule.verifiedAdvice.generalTips || []));
        adviceLists.ayurvedicDietaryNotes.push(...(m.rule.verifiedAdvice.ayurvedicDietaryNotes || []));
        adviceLists.safeRemedies.push(...(m.rule.verifiedAdvice.safeRemedies || []));
      }
    }

    const verifiedAdvice = {
      generalTips: [...new Set(adviceLists.generalTips)],
      ayurvedicDietaryNotes: [...new Set(adviceLists.ayurvedicDietaryNotes)],
      safeRemedies: [...new Set(adviceLists.safeRemedies)],
    };

    const hasAdvice = Object.values(verifiedAdvice).some((arr) => arr.length > 0);

    return {
      dangerLevel: highestLevel,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      verifiedAdvice: hasAdvice ? verifiedAdvice : defaultSelfCareAdvice(normalizedLang),
      matchedKeywords,
      matchedRuleIds,
      requiresHumanReview,
      reason: 'rule_matched',
    };
  }

  const isEmergency = /(chest pain|heart attack|unconscious|cannot breathe|heavy bleeding|stroke|seizure)/i.test(text);
  const hasSymptom = MEDICAL_WHITELIST.test(text) || /(fever|pain|ache|cough|vomit|diarrhea|rash|chills|dizzy)/i.test(text);

  if (!isEmergency && !hasSymptom) {
    return {
      dangerLevel: 'low',
      confidenceScore: 0.1,
      isGibberish: true,
      requiresHumanReview: false,
      reason: 'no_symptoms_detected',
      verifiedAdvice: {
        generalTips: ['No physical symptoms were detected. Please describe your health problem (e.g. fever, headache, or stomach discomfort) so Charak Vaani can assist you.'],
        ayurvedicDietaryNotes: [],
        safeRemedies: [],
      },
      matchedKeywords: [],
      matchedRuleIds: [],
    };
  }

  const danger = isEmergency ? 'high' : hasSymptom ? 'medium' : 'low';

  return {
    dangerLevel: danger,
    confidenceScore: 0.75,
    verifiedAdvice: defaultSelfCareAdvice(normalizedLang),
    matchedKeywords: [],
    matchedRuleIds: [],
    requiresHumanReview: danger !== 'low',
    reason: 'clinical_fallback',
  };
};

export const statusForAssessment = ({ dangerLevel, confidenceScore, verifiedAdvice, isGreeting, isGibberish }) => {
  if (isGreeting || isGibberish) return 'resolved_selfcare';
  if (dangerLevel === 'high') return 'emergency_alerted';
  if (dangerLevel === 'medium') return 'pending_doctor';
  if (confidenceScore >= LOW_CONFIDENCE_THRESHOLD && verifiedAdvice) {
    return 'resolved_selfcare';
  }
  return 'pending_doctor';
};

export { DANGER_LEVELS };
