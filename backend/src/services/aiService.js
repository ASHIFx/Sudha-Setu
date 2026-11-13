import { GoogleGenAI } from '@google/genai';
import {
  formatGroundingContext,
  extractCitations,
} from './ragService.js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

const BASE_SYSTEM_INSTRUCTION =
  'You are Sudha Setu AI, an intelligent clinical health triage and wellness assistant. ' +
  'Offer helpful, empathetic, non-definitive guidance grounded in clinical wellness principles. ' +
  'Always remind users to consult a verified doctor for definitive diagnosis or prescriptions. ' +
  'Do not provide emergency medical advice — if a user describes a life-threatening situation, ' +
  'instruct them to call emergency services (112) immediately.\n\n' +
  'CLINICAL GROUNDING & CITATION PROTOCOL:\n' +
  '1. Whenever offering Ayurvedic dietary guidance, home remedies, or lifestyle advice, you MUST ground ' +
  'your answer strictly in the provided verified Knowledge Base entries.\n' +
  '2. For EVERY recommendation derived from a Knowledge Base entry, you MUST cite the rule ID ' +
  'in your response using the exact format: [Ref: Rule <RULE_ID>] (e.g. "[Ref: Rule 64f123...]"). ' +
  'This is mandatory so reviewing doctors can trace and audit the clinical source.\n' +
  '3. If the user describes symptoms not covered in the retrieved Knowledge Base entries, ' +
  'explicitly state that no pre-verified protocol is found and recommend a consultation with a qualified doctor.\n' +
  '4. Never invent unverified medicines or clinical claims.';

const buildHistory = (storedMessages) =>
  storedMessages.map((m) => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

let _client = null;

const getClient = () => {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_actual')) {
    return null;
  }
  _client = new GoogleGenAI({ apiKey });
  return _client;
};

export const assessSymptomWithLLM = async (patientText, languageUsed = 'en', retrievedRules = []) => {
  const client = getClient();
  if (!client) return null;

  const grounding = formatGroundingContext(retrievedRules);
  const prompt = `You are Sudha Setu's clinical AI triage engine. Analyze this patient input.
Patient Text: "${patientText}"
Target Language: "${languageUsed}"

${grounding ? `${grounding}\n\nGround your clinical advice and home remedies in the verified Knowledge Base entries above whenever relevant.` : ''}

Respond ONLY with valid JSON having this exact structure:
{
  "isGibberish": true or false,
  "isGreeting": true or false,
  "dangerLevel": "low" or "medium" or "high",
  "confidenceScore": number between 0.6 and 0.98,
  "requiresHumanReview": true or false,
  "clinicalSummary": "concise explanation of condition and risk tier in ${languageUsed}",
  "generalTips": ["tip 1 in ${languageUsed}", "tip 2 in ${languageUsed}"],
  "ayurvedicDietaryNotes": ["diet tip 1 in ${languageUsed}", "diet tip 2 in ${languageUsed}"],
  "safeRemedies": ["safe home remedy or herbal step in ${languageUsed}"]
}

Clinical Guidelines:
- If input is random keyboard characters, spam, repeated nonsense keys, or child typing without symptoms (e.g. "asdfasdf", "123123", "qwerty", "zzzzz"), set "isGibberish": true, "dangerLevel": "low", "requiresHumanReview": false.
- If input is a greeting or general phrase without symptoms (e.g. "hi", "hii", "hello", "namaste", "vanakkam"), set "isGreeting": true, "dangerLevel": "low", "requiresHumanReview": false.
- If input indicates severe distress, crushing chest pain, stroke, seizure, severe breathing collapse, or heavy bleeding, set "dangerLevel": "high", "requiresHumanReview": true.
- If input describes persistent fever (>2-3 days), acute ongoing infection, or conditions needing doctor evaluation, set "dangerLevel": "medium", "requiresHumanReview": true.
- If input is mild or conversational wellness, set "dangerLevel": "low", "requiresHumanReview": false.
- Translate all tips, dietary notes, safe remedies, and clinicalSummary into the target language: "${languageUsed}" (e.g. if mr: Marathi, if hi: Hindi, if bn: Bengali, if ta: Tamil, if en: English).`;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text);
    if (!['low', 'medium', 'high'].includes(parsed.dangerLevel) ||
        !Number.isFinite(parsed.confidenceScore) || parsed.confidenceScore < 0 || parsed.confidenceScore > 1) {
      throw new Error('Invalid AI assessment');
    }
    return {
      isGibberish: Boolean(parsed.isGibberish),
      isGreeting: Boolean(parsed.isGreeting),
      dangerLevel: parsed.dangerLevel || 'low',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.85,
      requiresHumanReview: Boolean(parsed.requiresHumanReview),
      clinicalSummary: typeof parsed.clinicalSummary === 'string' ? parsed.clinicalSummary : '',
      verifiedAdvice: {
        generalTips: Array.isArray(parsed.generalTips) ? parsed.generalTips : [],
        ayurvedicDietaryNotes: Array.isArray(parsed.ayurvedicDietaryNotes) ? parsed.ayurvedicDietaryNotes : [],
        safeRemedies: Array.isArray(parsed.safeRemedies) ? parsed.safeRemedies : [],
      },
    };
  } catch (err) {
    console.warn('[aiService] LLM assessment fallback:', err.message);
    return null;
  }
};

export const sendChatMessage = async (storedMessages, userMessage, { retrievedRules = [] } = {}) => {
  const client = getClient();

  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const priorHistory = buildHistory(storedMessages);
  const groundingContext = formatGroundingContext(retrievedRules);

  const fullSystemInstruction = groundingContext
    ? `${BASE_SYSTEM_INSTRUCTION}\n\n${groundingContext}`
    : BASE_SYSTEM_INSTRUCTION;

  const chat = client.chats.create({
    model: MODEL,
    config: {
      systemInstruction: fullSystemInstruction,
    },
    history: priorHistory,
  });

  const response = await chat.sendMessage({ message: userMessage });
  const replyText = response.text || '';
  const citedRules = extractCitations(replyText, retrievedRules);

  return {
    text: replyText,
    citedRules,
    retrievedRules: retrievedRules.map((r) => ({
      _id: r._id,
      keywordTriggers: r.keywordTriggers,
      dangerClassification: r.dangerClassification,
      relevanceScore: r.relevanceScore,
    })),
  };
};
