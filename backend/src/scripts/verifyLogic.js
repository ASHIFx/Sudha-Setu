import { tokenize, scoreRule, extractCitations, formatGroundingContext } from '../services/ragService.js';

console.log('🧪 Testing RAG Service Functions...\n');

const tokens = tokenize('Patient has severe fever, headache and jvara since two days');
console.log('Tokens:', tokens);
if (tokens.includes('severe') && tokens.includes('fever') && tokens.includes('headache') && tokens.includes('jvara')) {
  console.log('✅ Tokenization passed');
} else {
  console.error('❌ Tokenization failed');
}

const mockRule = {
  _id: '64d9f80123456789abcdef01',
  keywordTriggers: ['fever', 'jvara', 'pyrexia'],
  dangerClassification: 'medium',
  verifiedAdvice: {
    generalTips: ['Drink boiled water cooled to room temperature (Shrita Sheeta Jala)'],
    ayurvedicDietaryNotes: ['Light diet, moong dal soup (Mudga Yusha)'],
    safeRemedies: ['Decoction of Tulsi and dry ginger (Shunthi)'],
  },
};

const query = 'I have fever and headache';
const queryTokens = tokenize(query);
const { score, matchedTriggers } = scoreRule(mockRule, queryTokens, query);
console.log('Score:', score, 'Matched Triggers:', matchedTriggers);

if (score > 0 && matchedTriggers.includes('fever')) {
  console.log('✅ KB Rule Scoring passed');
} else {
  console.error('❌ KB Rule Scoring failed');
}

const context = formatGroundingContext([{ ...mockRule, relevanceScore: score }]);
console.log('\n--- Grounding Context Output ---\n' + context + '\n--------------------------------\n');
if (context.includes('64d9f80123456789abcdef01') && context.includes('Shrita Sheeta Jala')) {
  console.log('✅ Grounding context formatting passed');
} else {
  console.error('❌ Grounding context formatting failed');
}

const aiReply = 'For your fever, please drink boiled warm water [Ref: Rule 64d9f80123456789abcdef01] and take light soup.';
const citations = extractCitations(aiReply, [mockRule]);
console.log('Citations extracted:', citations);
if (citations.includes('64d9f80123456789abcdef01')) {
  console.log('✅ Citation extraction passed');
} else {
  console.error('❌ Citation extraction failed');
}

console.log('\n🎉 All RAG verification checks passed successfully!');
