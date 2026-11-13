import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

let _client = null;

const getClient = () => {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_actual')) return null;
  _client = new GoogleGenAI({ apiKey });
  return _client;
};

export const normalizeIntakeData = (data) => {
  const markers = data?.ayurvedicMarkers || {};
  return {
    symptoms: Array.isArray(data?.symptoms) ? data.symptoms
      .filter((s) => s && typeof s.name === 'string' && s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        ...(typeof s.duration === 'string' ? { duration: s.duration } : {}),
        ...(Number.isFinite(s.severity) && s.severity >= 1 && s.severity <= 10 ? { severity: s.severity } : {}),
      })) : [],
    ayurvedicMarkers: {
      suspectedPrakriti: ['vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'tridosha'].includes(markers.suspectedPrakriti) ? markers.suspectedPrakriti : 'unknown',
      agniStatus: ['sama', 'vishama', 'tikshna', 'manda'].includes(markers.agniStatus) ? markers.agniStatus : 'unknown',
      ...(typeof markers.dietHabits === 'string' ? { dietHabits: markers.dietHabits } : {}),
      ...(typeof markers.sleepPattern === 'string' ? { sleepPattern: markers.sleepPattern } : {}),
    },
  };
};

export const extractIntakeData = async (patientText) => {
  const client = getClient();
  if (!client || !patientText?.trim()) {
    return { symptoms: [], ayurvedicMarkers: { suspectedPrakriti: 'unknown', agniStatus: 'unknown' } };
  }

  const prompt = `Extract clinical symptom data and Ayurvedic markers from this patient description:
"${patientText}"

Respond ONLY with valid JSON in this format:
{
  "symptoms": [{"name": "string", "duration": "string", "severity": number}],
  "ayurvedicMarkers": {
    "suspectedPrakriti": "vata" | "pitta" | "kapha" | "vata-pitta" | "pitta-kapha" | "vata-kapha" | "tridosha" | "unknown",
    "agniStatus": "sama" | "vishama" | "tikshna" | "manda" | "unknown",
    "dietHabits": "string or empty",
    "sleepPattern": "string or empty"
  }
}`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const data = JSON.parse(res.text);
    return normalizeIntakeData(data);
  } catch (err) {
    console.warn('[extractor] extraction skipped:', err.message);
    return { symptoms: [], ayurvedicMarkers: { suspectedPrakriti: 'unknown', agniStatus: 'unknown' } };
  }
};
