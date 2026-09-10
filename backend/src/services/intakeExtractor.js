import { GoogleGenAI, Type } from '@google/genai';

const MODEL = 'gemini-3.6-flash';

const EXTRACTION_TIMEOUT_MS = 3000;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    symptoms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Symptom name in lowercase English',
          },
          duration: {
            type: Type.STRING,
            description: 'How long the patient has had this symptom, e.g. "3 days"',
          },
          severity: {
            type: Type.INTEGER,
            description: 'Severity on a scale of 1 (mild) to 10 (severe)',
          },
        },
        required: ['name'],
      },
      description: 'List of symptoms mentioned by the patient',
    },
    ayurvedicMarkers: {
      type: Type.OBJECT,
      properties: {
        suspectedPrakriti: {
          type: Type.STRING,
          enum: ['vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'tridosha', 'unknown'],
          description: 'Suspected Ayurvedic body constitution (prakriti)',
        },
        agniStatus: {
          type: Type.STRING,
          enum: ['sama', 'vishama', 'tikshna', 'manda', 'unknown'],
          description: 'Estimated digestive fire (agni) status',
        },
        dietHabits: {
          type: Type.STRING,
          description: 'Any dietary habits or patterns mentioned or implied',
        },
        sleepPattern: {
          type: Type.STRING,
          description: 'Any sleep-related patterns mentioned or implied',
        },
      },
      required: ['suspectedPrakriti', 'agniStatus'],
    },
  },
  required: ['symptoms', 'ayurvedicMarkers'],
};

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

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`extraction timed out after ${ms}ms`)), ms)
    ),
  ]);

export const extractIntakeData = async (patientText) => {
  const client = getClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const prompt =
    'You are a clinical data extractor for an Ayurvedic triage system. ' +
    'Extract structured symptom and Ayurvedic marker information from the patient description below. ' +
    'Return only what can be inferred from the text — do not fabricate details. ' +
    'For any Ayurvedic fields you cannot determine, use "unknown".\n\n' +
    'Patient description:\n' +
    patientText;

  const response = await withTimeout(
    client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
    EXTRACTION_TIMEOUT_MS
  );

  const parsed = JSON.parse(response.text);

  if (!Array.isArray(parsed.symptoms) || typeof parsed.ayurvedicMarkers !== 'object') {
    throw new Error('extraction response did not match expected shape');
  }

  return {
    symptoms: parsed.symptoms.filter(
      (s) => s && typeof s.name === 'string' && s.name.trim()
    ),
    ayurvedicMarkers: parsed.ayurvedicMarkers,
  };
};
