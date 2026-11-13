import KnowledgeBase, { DANGER_LEVELS } from '../models/KnowledgeBase.js';
import { assessSymptomWithLLM } from './aiService.js';

export const LOW_CONFIDENCE_THRESHOLD = 0.55;

const LEVEL_RANK = { low: 1, medium: 2, high: 3 };

const GREETING_PATTERN = /^(hi|hii|hiii|hello|hey|heyy|namaste|namaskar|pranam|good\s*(morning|evening|afternoon)|hola|test|testing|kya\s*haal|kaise\s*ho)[\s!.,?]*$/i;

const NEGATIONS = ['no', 'not', 'never', 'without', 'denies', 'nahi', 'nahin', 'नहीं', 'नही'];

const hasNegation = (text, idx) => {
  const prefix = text.slice(Math.max(0, idx - 30), idx).toLowerCase();
  return NEGATIONS.some((n) => prefix.includes(n));
};

const defaultSelfCareAdvice = () => ({
  generalTips: [
    'Hello! Sudha Setu health triage is active and ready to assist you.',
    'Please describe your symptoms, duration, and severity in Hindi or English.',
  ],
  ayurvedicDietaryNotes: [
    'Drink boiled warm water throughout the day to support digestive fire.',
    'Favor freshly prepared, light meals suited to your current appetite.',
  ],
  safeRemedies: [
    'Mention symptoms (e.g. fever for 2 days, mild headache) for detailed clinical evaluation.',
  ],
});

export const analyzeSymptoms = async (patientText, languageUsed = 'en') => {
  const text = String(patientText || '').trim();

  if (!text || GREETING_PATTERN.test(text)) {
    return {
      dangerLevel: 'low',
      confidenceScore: 0.95,
      verifiedAdvice: defaultSelfCareAdvice(),
      matchedKeywords: [],
      matchedRuleIds: [],
      requiresHumanReview: false,
      reason: text ? 'conversational_greeting' : 'empty_input',
    };
  }

  const lowerText = text.toLowerCase();
  const rules = await KnowledgeBase.find({ active: true }).lean();

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

  if (matches.length === 0) {
    const llmResult = await assessSymptomWithLLM(text, languageUsed);
    if (llmResult) {
      return {
        dangerLevel: llmResult.dangerLevel,
        confidenceScore: llmResult.confidenceScore,
        verifiedAdvice: llmResult.verifiedAdvice,
        matchedKeywords: [],
        matchedRuleIds: [],
        requiresHumanReview: llmResult.requiresHumanReview,
        reason: 'llm_assessed',
      };
    }

    const isEmergency = /(chest pain|heart attack|unconscious|cannot breathe|heavy bleeding|stroke|seizure)/i.test(text);
    const hasSymptom = /(fever|pain|ache|cough|vomit|diarrhea|rash|chills|dizzy)/i.test(text);
    const danger = isEmergency ? 'high' : hasSymptom ? 'medium' : 'low';

    return {
      dangerLevel: danger,
      confidenceScore: 0.75,
      verifiedAdvice: defaultSelfCareAdvice(),
      matchedKeywords: [],
      matchedRuleIds: [],
      requiresHumanReview: danger !== 'low',
      reason: 'clinical_fallback',
    };
  }

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
    verifiedAdvice: hasAdvice ? verifiedAdvice : defaultSelfCareAdvice(),
    matchedKeywords,
    matchedRuleIds,
    requiresHumanReview,
    reason: 'rule_matched',
  };
};

export const statusForAssessment = ({ dangerLevel, confidenceScore, verifiedAdvice }) => {
  if (dangerLevel === 'high') return 'emergency_alerted';
  if (dangerLevel === 'medium') return 'pending_doctor';
  if (confidenceScore >= LOW_CONFIDENCE_THRESHOLD && verifiedAdvice) {
    return 'resolved_selfcare';
  }
  return 'pending_doctor';
};

export { DANGER_LEVELS };
