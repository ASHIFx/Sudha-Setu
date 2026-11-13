import { GoogleGenAI } from '@google/genai';
import {
  formatGroundingContext,
  extractCitations,
} from './ragService.js';

const MODEL = 'gemini-3.5-flash-lite';

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

export const assessSymptomWithLLM = async (patientText, languageUsed = 'en') => {
  const client = getClient();
  if (!client) return null;

  const prompt = `Analyze this user input for an intelligent health triage system.
User Input: "${patientText}"
Language: ${languageUsed}

Respond ONLY with valid JSON having this exact structure:
{
  "isGreeting": true or false,
  "dangerLevel": "low" or "medium" or "high",
  "confidenceScore": number between 0.6 and 0.98,
  "requiresHumanReview": true or false,
  "generalTips": ["string tip 1", "string tip 2"],
  "ayurvedicDietaryNotes": ["dietary tip 1", "dietary tip 2"],
  "safeRemedies": ["safe home remedy or next step 1"]
}

Guidelines:
- If input is a greeting or general phrase without symptoms (e.g., "hi", "hii", "hello", "namaste", "pranam", "how are you"), set isGreeting: true, dangerLevel: "low", requiresHumanReview: false.
- If input indicates severe distress, chest pain, stroke, breathing collapse, or massive trauma, set dangerLevel: "high", requiresHumanReview: true.
- If input describes persistent or moderate acute disease, set dangerLevel: "medium", requiresHumanReview: true.
- If input is mild or conversational wellness, set dangerLevel: "low", requiresHumanReview: false.
- Respond in the requested language: "${languageUsed}" (if hi: Hindi, if bn: Bengali, if mr: Marathi, if ta: Tamil, if en: English). Translate all strings in generalTips, ayurvedicDietaryNotes, and safeRemedies into this language.`;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text);
    return {
      dangerLevel: parsed.dangerLevel || 'low',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.85,
      requiresHumanReview: Boolean(parsed.requiresHumanReview),
      isGreeting: Boolean(parsed.isGreeting),
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
