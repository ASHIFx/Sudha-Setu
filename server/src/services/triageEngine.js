import KnowledgeBase, { DANGER_LEVELS } from '../models/KnowledgeBase.js';

/**
 * Rule-matching triage engine.
 *
 * Design rules, in priority order:
 *  1. The highest danger level among all matched rules wins. A rule matching
 *     'low' never dilutes a concurrent 'high' match.
 *  2. No match is NOT low danger. An unrecognised complaint routes to a human
 *     with low confidence, because silence from the rulebook is ignorance, not
 *     reassurance.
 *  3. Verified advice is only ever returned for a confident 'low'. Medium and
 *     high cases belong to a physician.
 */

const LEVEL_RANK = { low: 1, medium: 2, high: 3 };

/** Below this, the case should reach a human regardless of danger level. */
export const LOW_CONFIDENCE_THRESHOLD = 0.55;

/** Hedges that reduce confidence. They never downgrade a high-danger match. */
const NEGATION_CUES = [
  'no', 'not', 'never', 'without', 'denies', 'denied',
  'nahi', 'nahin', 'naa', 'नहीं', 'नही',
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Unicode-aware whole-word match, so a trigger like 'gas' does not fire on
 * 'gastritis' and Devanagari triggers match correctly (JS `\b` is ASCII-only).
 */
const buildMatcher = (keyword) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(keyword)}(?![\\p{L}\\p{N}])`, 'iu');

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round2 = (n) => Math.round(n * 100) / 100;

/** True when a negation cue sits within a few words before the match. */
const isNegated = (text, matchIndex) => {
  const window = text.slice(Math.max(0, matchIndex - 40), matchIndex);
  return NEGATION_CUES.some((cue) => buildMatcher(cue).test(window));
};

/**
 * Analyse free-text patient input against the active knowledge base.
 *
 * @param {string} patientText raw transcript of what the patient said or typed
 * @returns {Promise<{
 *   dangerLevel: 'low'|'medium'|'high',
 *   confidenceScore: number,
 *   verifiedAdvice: { generalTips: string[], ayurvedicDietaryNotes: string[], safeRemedies: string[] } | null,
 *   matchedKeywords: string[],
 *   matchedRuleIds: string[],
 *   requiresHumanReview: boolean,
 *   reason: string
 * }>}
 */
export const analyzeSymptoms = async (patientText) => {
  const text = String(patientText ?? '').trim();

  if (!text) {
    return {
      dangerLevel: 'medium',
      confidenceScore: 0.1,
      verifiedAdvice: null,
      matchedKeywords: [],
      matchedRuleIds: [],
      requiresHumanReview: true,
      reason: 'empty_input',
    };
  }

  const rules = await KnowledgeBase.find({ active: true }).lean();

  const matches = [];
  for (const rule of rules) {
    const hits = [];
    let negatedHits = 0;

    for (const keyword of rule.keywordTriggers ?? []) {
      const found = buildMatcher(keyword).exec(text);
      if (!found) continue;
      hits.push(keyword);
      // Hedged mentions still count for high danger, but weaken confidence.
      if (isNegated(text, found.index)) negatedHits += 1;
    }

    if (hits.length > 0) {
      matches.push({ rule, hits, negatedHits });
    }
  }

  if (matches.length === 0) {
    // Unknown complaint. Route to a doctor rather than offer self-care.
    return {
      dangerLevel: 'medium',
      confidenceScore: 0.25,
      verifiedAdvice: null,
      matchedKeywords: [],
      matchedRuleIds: [],
      requiresHumanReview: true,
      reason: 'no_rule_matched',
    };
  }

  // Safety-first: escalate to the most severe level seen, not the most frequent.
  const dangerLevel = matches.reduce(
    (worst, m) =>
      LEVEL_RANK[m.rule.dangerClassification] > LEVEL_RANK[worst]
        ? m.rule.dangerClassification
        : worst,
    'low'
  );

  const winning = matches.filter((m) => m.rule.dangerClassification === dangerLevel);
  const distinctHits = new Set(winning.flatMap((m) => m.hits)).size;
  const negated = winning.reduce((sum, m) => sum + m.negatedHits, 0);

  // More independent keyword evidence => more confidence.
  let confidence = 0.45 + 0.15 * distinctHits;

  // Rules from other danger levels also fired: the picture is mixed.
  const conflicting = new Set(matches.map((m) => m.rule.dangerClassification)).size - 1;
  if (conflicting > 0) confidence -= 0.1 * conflicting;

  // Every hit was hedged ("no chest pain") => treat the signal as weak.
  if (negated > 0) confidence -= 0.15 * (negated / distinctHits);

  confidence = round2(clamp(confidence, 0.1, 0.95));

  const requiresHumanReview =
    dangerLevel !== 'low' || confidence < LOW_CONFIDENCE_THRESHOLD;

  // Advice is patient-facing and unsupervised, so gate it hard.
  let verifiedAdvice = null;
  if (dangerLevel === 'low' && confidence >= LOW_CONFIDENCE_THRESHOLD) {
    const merged = { generalTips: [], ayurvedicDietaryNotes: [], safeRemedies: [] };
    for (const m of winning) {
      // The schema guard means stored advice always has a verifying doctor,
      // but re-check here so an unverified row can never reach a patient.
      if (!m.rule.verifiedByDoctorId) continue;
      for (const key of Object.keys(merged)) {
        merged[key].push(...(m.rule.verifiedAdvice?.[key] ?? []));
      }
    }
    for (const key of Object.keys(merged)) {
      merged[key] = [...new Set(merged[key])];
    }
    const hasAny = Object.values(merged).some((v) => v.length > 0);
    if (hasAny) verifiedAdvice = merged;
  }

  return {
    dangerLevel,
    confidenceScore: confidence,
    verifiedAdvice,
    matchedKeywords: [...new Set(winning.flatMap((m) => m.hits))],
    matchedRuleIds: winning.map((m) => String(m.rule._id)),
    requiresHumanReview,
    reason: 'rule_matched',
  };
};

/**
 * Maps a triage result onto the CaseSheet status the PRD specifies for it.
 *
 * @param {{ dangerLevel: string, confidenceScore: number, verifiedAdvice: object|null }} assessment
 * @returns {'resolved_selfcare'|'pending_doctor'|'emergency_alerted'|'escalated_human'}
 */
export const statusForAssessment = ({ dangerLevel, confidenceScore, verifiedAdvice }) => {
  if (dangerLevel === 'high') return 'emergency_alerted';
  if (dangerLevel === 'medium') return 'pending_doctor';
  // Low danger, but only self-serve if we are confident and actually have
  // doctor-verified advice to hand back.
  if (confidenceScore >= LOW_CONFIDENCE_THRESHOLD && verifiedAdvice) {
    return 'resolved_selfcare';
  }
  return 'pending_doctor';
};

export { DANGER_LEVELS };
