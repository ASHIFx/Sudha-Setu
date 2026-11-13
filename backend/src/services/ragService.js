import mongoose from 'mongoose';
import KnowledgeBase from '../models/KnowledgeBase.js';

export const retrieveRelevantKnowledge = async (userText, topK = 3) => {
  if (!userText || typeof userText !== 'string' || !userText.trim()) {
    return [];
  }

  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  const query = userText.toLowerCase();
  const words = query.split(/\s+/).filter((w) => w.length > 2);

  const activeRules = await KnowledgeBase.find({ active: true }).lean();
  if (!activeRules.length) return [];

  const scored = [];
  for (const rule of activeRules) {
    let score = 0;
    const matchedTriggers = [];

    for (const trigger of rule.keywordTriggers || []) {
      const t = String(trigger).toLowerCase();
      if (query.includes(t)) {
        score += 15;
        matchedTriggers.push(trigger);
      } else if (words.some((w) => t.includes(w))) {
        score += 5;
        matchedTriggers.push(trigger);
      }
    }

    const adviceText = [
      ...(rule.verifiedAdvice?.generalTips || []),
      ...(rule.verifiedAdvice?.ayurvedicDietaryNotes || []),
      ...(rule.verifiedAdvice?.safeRemedies || []),
    ].join(' ').toLowerCase();

    for (const w of words) {
      if (adviceText.includes(w)) score += 2;
    }

    if (score > 0) {
      scored.push({ ...rule, relevanceScore: score, matchedTriggers });
    }
  }

  return scored.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, topK);
};

export const formatGroundingContext = (retrievedRules) => {
  if (!retrievedRules || !retrievedRules.length) return '';

  const entries = retrievedRules.map((rule, idx) => {
    const advice = rule.verifiedAdvice || {};
    const tips = (advice.generalTips || []).map((t) => ` - ${t}`).join('\n');
    const diet = (advice.ayurvedicDietaryNotes || []).map((d) => ` - ${d}`).join('\n');
    const remedies = (advice.safeRemedies || []).map((r) => ` - ${r}`).join('\n');

    return `[ENTRY #${idx + 1}] ID: ${rule._id} | Classification: ${rule.dangerClassification}\nTriggers: ${(rule.keywordTriggers || []).join(', ')}\nTips:\n${tips}\nDiet:\n${diet}\nRemedies:\n${remedies}`;
  });

  return `=== RETRIEVED CLINICAL KNOWLEDGE BASE ENTRIES ===\n${entries.join('\n\n')}`;
};

export const extractCitations = (aiReply = '', retrievedRules = []) => {
  const ids = retrievedRules.map((r) => String(r._id));
  return ids.filter((id) => aiReply.includes(id));
};
