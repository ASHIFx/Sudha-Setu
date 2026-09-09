import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.6-flash';

const SYSTEM_INSTRUCTION =
  'You are Sudha Setu AI, a medical triage and Ayurvedic wellness assistant ' +
  'built for the Ministry of Ayush. Offer helpful, empathetic, non-definitive guidance ' +
  'grounded in Ayurvedic principles. Always remind users to consult a verified doctor ' +
  'for diagnosis or prescriptions. Do not provide emergency medical advice — if a user ' +
  'describes a life-threatening situation, instruct them to call emergency services immediately.';

/**
 * Build a @google/genai-compatible history array from stored Chat messages.
 * The history passed to ai.chats.create must NOT include the current user turn;
 * that is sent via chat.sendMessage() separately.
 */
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
    return null; // signal: API key not configured
  }
  _client = new GoogleGenAI({ apiKey });
  return _client;
};

/**
 * Send a user message in the context of an existing conversation.
 *
 * @param {Array}  storedMessages  - All prior messages from the Chat document
 *                                   (NOT including the current user message yet)
 * @param {string} userMessage     - The new message text from the user
 * @returns {Promise<string>}      - The AI reply text
 * @throws  {Error}                - If the Gemini API call fails
 */
export const sendChatMessage = async (storedMessages, userMessage) => {
  const client = getClient();

  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Exclude the message we are about to send from the history seed
  const priorHistory = buildHistory(storedMessages);

  const chat = client.chats.create({
    model: MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    history: priorHistory,
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text;
};
