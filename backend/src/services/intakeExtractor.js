export const extractIntakeData = async (patientText) => {
  const text = String(patientText || '').trim();
  if (!text) {
    return { symptoms: [], ayurvedicMarkers: { suspectedPrakriti: 'unknown', agniStatus: 'unknown' } };
  }

  const lower = text.toLowerCase();
  const symptoms = [];

  const CLINICAL_MAPPINGS = [
    { name: 'Chest Pain / Angina', regex: /(chest pain|crushing pain|left arm pain|heart attack)/i, severity: 3 },
    { name: 'Fever / Pyrexia', regex: /(fever|high temperature|chills|shivering|bukhar)/i, severity: 2 },
    { name: 'Breathing Difficulty', regex: /(breathless|cannot breathe|difficulty breathing|shortness of breath)/i, severity: 3 },
    { name: 'Acidity / Heartburn', regex: /(acidity|acid reflux|heartburn|burning stomach|gas|indigestion|amlapitta)/i, severity: 1 },
    { name: 'Headache / Cephalea', regex: /(headache|head pain|migraine|shirahshoola|sar dard)/i, severity: 1 },
    { name: 'Cough & Cold', regex: /(cough|sore throat|throat pain|phlegm|cold|kasa|pratishyaya)/i, severity: 1 },
    { name: 'Joint Pain & Stiffness', regex: /(joint pain|knee pain|arthritis|stiffness|sandhivata|amavata)/i, severity: 2 },
    { name: 'Abdominal Cramps', regex: /(stomach pain|belly pain|stomach ache|pet dard|cramp)/i, severity: 2 },
    { name: 'Fatigue & Weakness', regex: /(weakness|tiredness|fatigue|exhaustion|kamzori)/i, severity: 1 },
  ];

  for (const item of CLINICAL_MAPPINGS) {
    if (item.regex.test(lower)) {
      symptoms.push({ name: item.name, duration: 'recent', severity: item.severity });
    }
  }

  let suspectedPrakriti = 'unknown';
  if (/(joint pain|constipation|gas|dry|tremor|vata)/i.test(lower)) suspectedPrakriti = 'vata';
  else if (/(burning|acidity|fever|heat|rash|pitta)/i.test(lower)) suspectedPrakriti = 'pitta';
  else if (/(congestion|cough|heavy|mucus|cold|kapha)/i.test(lower)) suspectedPrakriti = 'kapha';

  let agniStatus = 'unknown';
  if (/(burning|severe acidity|fast burning)/i.test(lower)) agniStatus = 'tikshna';
  else if (/(irregular|bloating|cramping)/i.test(lower)) agniStatus = 'vishama';
  else if (/(heavy|sluggish digestion|loss of appetite)/i.test(lower)) agniStatus = 'manda';

  return {
    symptoms,
    ayurvedicMarkers: {
      suspectedPrakriti,
      agniStatus,
      dietHabits: '',
      sleepPattern: '',
    },
  };
};
