import KnowledgeBase from '../models/KnowledgeBase.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'i', 'me', 'my', 'have', 'having', 'had', 'feel', 'feeling',
  'am', 'do', 'does', 'did', 'so', 'very', 'too', 'also', 'plz', 'please',
  'mujhe', 'ho', 'hai', 'mera', 'meri', 'mere', 'ko', 'se', 'me', 'aur', 'ka', 'ke', 'ki'
]);

/**
 * Tokenizes and normalizes input text into keywords
 */
export const tokenize = (text = '') => {
  if (typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
};

/**
 * Computes TF-IDF / Keyword relevance score between query and a KB entry
 */
export const scoreRule = (rule, queryTokens, rawQuery) => {
  const queryLower = rawQuery.toLowerCase();
  let score = 0;
  const matchedTriggers = [];

  const triggers = (rule.keywordTriggers || []).map((t) => String(t).toLowerCase().trim());

  // 1. Exact trigger phrase match (high priority)
  for (const trigger of triggers) {
    if (queryLower.includes(trigger)) {
      score += 15;
      matchedTriggers.push(trigger);
    } else {
      // Partial token match within trigger
      const triggerTokens = tokenize(trigger);
      for (const qt of queryTokens) {
        if (triggerTokens.includes(qt)) {
          score += 6;
          matchedTriggers.push(trigger);
          break;
        }
      }
    }
  }

  // 2. Advice matches (General Tips, Dietary Notes, Safe Remedies)
  const advice = rule.verifiedAdvice || {};
  const allAdviceText = [
    ...(advice.generalTips || []),
    ...(advice.ayurvedicDietaryNotes || []),
    ...(advice.safeRemedies || []),
  ]
    .join(' ')
    .toLowerCase();

  const adviceTokens = tokenize(allAdviceText);
  for (const qt of queryTokens) {
    const freq = adviceTokens.filter((at) => at === qt).length;
    if (freq > 0) {
      score += Math.min(freq, 3) * 2;
    }
  }

  return { score, matchedTriggers: [...new Set(matchedTriggers)] };
};

/**
 * Retrieves the most relevant KnowledgeBase entries for the given user intake text.
 * @param {string} userText - The text query or symptoms from the patient.
 * @param {number} topK - Maximum number of entries to return (default 3).
 * @returns {Promise<Array>} List of scored KnowledgeBase documents.
 */
export const retrieveRelevantKnowledge = async (userText, topK = 3) => {
  if (!userText || typeof userText !== 'string' || !userText.trim()) {
    return [];
  }

  const queryTokens = tokenize(userText);
  if (queryTokens.length === 0) {
    return [];
  }

  // Fetch all active KnowledgeBase entries
  const activeRules = await KnowledgeBase.find({ active: true }).lean();
  if (!activeRules || activeRules.length === 0) {
    return [];
  }

  const scoredRules = [];

  for (const rule of activeRules) {
    const { score, matchedTriggers } = scoreRule(rule, queryTokens, userText);
    if (score > 0) {
      scoredRules.push({
        ...rule,
        relevanceScore: score,
        matchedTriggers,
      });
    }
  }

  // Sort by score descending
  scoredRules.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredRules.slice(0, topK);
};

/**
 * Formats retrieved KnowledgeBase entries into a structured grounding context for the LLM.
 */
export const formatGroundingContext = (retrievedRules) => {
  if (!retrievedRules || retrievedRules.length === 0) {
    return '';
  }

  let context = '=== RETRIEVED AYUSH CLINICAL KNOWLEDGE BASE ENTRIES ===\n';
  retrievedRules.forEach((rule, idx) => {
    context += `\n[ENTRY #${idx + 1}]`;
    context += `\nRULE_ID: ${rule._id}`;
    context += `\nTRIGGER_KEYWORDS: ${(rule.keywordTriggers || []).join(', ')}`;
    context += `\nDANGER_CLASSIFICATION: ${rule.dangerClassification || 'low'}`;

    const advice = rule.verifiedAdvice || {};
    if (advice.generalTips?.length > 0) {
      context += `\nGENERAL_TIPS:\n - ${advice.generalTips.join('\n - ')}`;
    }
    if (advice.ayurvedicDietaryNotes?.length > 0) {
      context += `\nAYURVEDIC_DIETARY_NOTES:\n - ${advice.ayurvedicDietaryNotes.join('\n - ')}`;
    }
    if (advice.safeRemedies?.length > 0) {
      context += `\nSAFE_REMEDIES:\n - ${advice.safeRemedies.join('\n - ')}`;
    }
    context += '\n------------------------------------------------------';
  });

  return context;
};

/**
 * Extracts citations from AI generated reply matching the retrieved rule IDs.
 */
export const extractCitations = (aiReply = '', retrievedRules = []) => {
  const citedRuleIds = new Set();
  const ruleIdStrings = retrievedRules.map((r) => String(r._id));

  // Match direct hex ObjectIds that exist in retrieved rules
  for (const id of ruleIdStrings) {
    if (aiReply.includes(id)) {
      citedRuleIds.add(id);
    }
  }

  // Regex match patterns like [Ref: Rule <id>], [Rule: <id>], [KB Rule <id>]
  const citationRegex = /(?:\[(?:Ref|Source|Rule|KB Rule):?\s*|Rule\s*#?)([a-f0-9]{24})/gi;
  let match;
  while ((match = citationRegex.exec(aiReply)) !== null) {
    if (ruleIdStrings.includes(match[1])) {
      citedRuleIds.add(match[1]);
    }
  }

  return Array.from(citedRuleIds);
};
