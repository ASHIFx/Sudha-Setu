import { GoogleGenAI } from '@google/genai';
import {
  formatGroundingContext,
  extractCitations,
} from './ragService.js';

const MODEL = 'gemini-2.5-flash';

const BASE_SYSTEM_INSTRUCTION =
  'You are Sudha Setu AI, a clinical triage and Ayurvedic wellness assistant ' +
  'built for the Ministry of Ayush. Offer helpful, empathetic, non-definitive guidance ' +
  'grounded in authentic Ayurvedic principles. Always remind users to consult a verified doctor ' +
  'for definitive diagnosis or prescriptions. Do not provide emergency medical advice — if a user ' +
  'describes a life-threatening situation, instruct them to call emergency services (112) immediately.\n\n' +
  'CLINICAL GROUNDING & CITATION PROTOCOL:\n' +
  '1. Whenever offering Ayurvedic dietary guidance, home remedies, or lifestyle advice, you MUST ground ' +
  'your answer strictly in the provided verified Knowledge Base entries.\n' +
  '2. For EVERY recommendation derived from a Knowledge Base entry, you MUST cite the rule ID ' +
  'in your response using the exact format: [Ref: Rule <RULE_ID>] (e.g. "[Ref: Rule 64f123...]"). ' +
  'This is mandatory so reviewing doctors can trace and audit the clinical source.\n' +
  '3. If the user describes symptoms not covered in the retrieved Knowledge Base entries, ' +
  'explicitly state that no pre-verified protocol is found and recommend a consultation with an Ayurvedic doctor.\n' +
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

/**
 * Sends a chat message to Gemini with injected KnowledgeBase RAG grounding and citations.
 * @param {Array} storedMessages - Prior conversation turns.
 * @param {string} userMessage - New user prompt.
 * @param {Object} options - RAG options including retrievedRules.
 * @returns {Promise<{ text: string, citedRules: Array<string>, retrievedRules: Array }>}
 */
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
