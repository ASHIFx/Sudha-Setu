const detectLanguage = (text = '') => {
  if (!text) return 'hi-IN';
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text) ? 'hi-IN' : 'en-IN';
};

console.log('🧪 Testing Language Detection & Speech Utilities...\n');

const hindiSample = 'मुझे तेज बुखार और सिरदर्द है';
const englishSample = 'I have high fever and severe headache';
const mixedSample = 'Fever hai aur सिरदर्द ho raha hai';

console.log('Hindi Sample detected as:', detectLanguage(hindiSample));
console.log('English Sample detected as:', detectLanguage(englishSample));
console.log('Mixed Sample detected as:', detectLanguage(mixedSample));

if (
  detectLanguage(hindiSample) === 'hi-IN' &&
  detectLanguage(englishSample) === 'en-IN' &&
  detectLanguage(mixedSample) === 'hi-IN'
) {
  console.log('✅ Language detection passed');
} else {
  console.error('❌ Language detection failed');
}
