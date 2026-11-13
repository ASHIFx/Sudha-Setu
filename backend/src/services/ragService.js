import KnowledgeBase from '../models/KnowledgeBase.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'i', 'me', 'my', 'have', 'having', 'had', 'feel', 'feeling',
  'am', 'do', 'does', 'did', 'so', 'very', 'too', 'also', 'plz', 'please',
  'mujhe', 'ho', 'hai', 'mera', 'meri', 'mere', 'ko', 'se', 'me', 'aur', 'ka', 'ke', 'ki'
]);

export const tokenize = (text = '') => {
  if (typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
};

export const scoreRule = (rule, queryTokens, rawQuery) => {
  const queryLower = rawQuery.toLowerCase();
  let score = 0;
  const matchedTriggers = [];

  const triggers = (rule.keywordTriggers || []).map((t) => String(t).toLowerCase().trim());

  for (const trigger of triggers) {
    if (queryLower.includes(trigger)) {
      score += 15;
      matchedTriggers.push(trigger);
    } else {
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

export const retrieveRelevantKnowledge = async (userText, topK = 3) => {
  if (!userText || typeof userText !== 'string' || !userText.trim()) {
    return [];
  }

  const queryTokens = tokenize(userText);
  if (queryTokens.length === 0) {
    return [];
  }

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

  scoredRules.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredRules.slice(0, topK);
};

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

export const extractCitations = (aiReply = '', retrievedRules = []) => {
  const citedRuleIds = new Set();
  const ruleIdStrings = retrievedRules.map((r) => String(r._id));

  for (const id of ruleIdStrings) {
    if (aiReply.includes(id)) {
      citedRuleIds.add(id);
    }
  }

  const citationRegex = /(?:\[(?:Ref|Source|Rule|KB Rule):?\s*|Rule\s*#?)([a-f0-9]{24})/gi;
  let match;
  while ((match = citationRegex.exec(aiReply)) !== null) {
    if (ruleIdStrings.includes(match[1])) {
      citedRuleIds.add(match[1]);
    }
  }

  return Array.from(citedRuleIds);
};
