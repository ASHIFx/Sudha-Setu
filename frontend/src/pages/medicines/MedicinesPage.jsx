import { useState, useMemo } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle2, Shield, Info, HeartPulse } from 'lucide-react';

const MEDICINES_DATA = [
  {
    id: 'triphala-churna',
    name: 'Triphala Churna',
    classicalName: 'त्रिफला चूर्ण',
    category: 'Digestion & Agni',
    form: 'Powder (Churna)',
    doshaAction: 'Tridosha Shamaka (Balances Vata, Pitta & Kapha)',
    ingredients: ['Amalaki (Emblica officinalis)', 'Haritaki (Terminalia chebula)', 'Bibhitaki (Terminalia bellirica)'],
    indications: ['Sluggish digestion (Mandagni)', 'Chronic constipation', 'Ocular fatigue & vision support', 'Mild detox (Ama-pachana)'],
    dosage: '3g to 6g at bedtime with lukewarm water',
    cautions: 'Avoid in acute diarrhea, dehydration, or late trimester pregnancy without physician guidance.',
    verified: true,
  },
  {
    id: 'ashwagandha-churna',
    name: 'Ashwagandha Rasayana',
    classicalName: 'अश्वगंधा रसायन',
    category: 'Stress & Sleep',
    form: 'Extract & Churna',
    doshaAction: 'Vata-Kapha Shamaka (Nourishing Rasayana)',
    ingredients: ['Ashwagandha Root (Withania somnifera)', 'Ghrita (Clarified Butter)', 'Sharkara'],
    indications: ['Chronic exhaustion & burnout', 'Anxiety & nervous debility', 'Sleep fragmentation (Nidranasha)', 'Musculoskeletal weakness'],
    dosage: '3g to 5g twice daily with warm milk or honey water',
    cautions: 'Use caution in acute hyperthyroidism or severe internal heat conditions (Tikshna Pitta).',
    verified: true,
  },
  {
    id: 'sitopaladi-churna',
    name: 'Sitopaladi Churna',
    classicalName: 'सितोपलादि चूर्ण',
    category: 'Respiratory & Cough',
    form: 'Fine Powder (Churna)',
    doshaAction: 'Kapha-Pitta Shamaka',
    ingredients: ['Mishri (Rock Sugar)', 'Vanshlochan (Bamboo Manna)', 'Pippali (Piper longum)', 'Ela (Cardamom)', 'Twak (Cinnamon)'],
    indications: ['Productive & dry cough (Kasa)', 'Bronchial irritation', 'Loss of appetite during mild fever', 'Upper respiratory inflammation'],
    dosage: '2g to 4g mixed with equal honey and ghee in unequal proportions, 2-3 times daily',
    cautions: 'Diabetic patients should monitor rock sugar content or opt for sugar-free formulation.',
    verified: true,
  },
  {
    id: 'giloy-ghanvati',
    name: 'Giloy Ghanvati (Guduchi)',
    classicalName: 'गिलोय घनवटी (गुडूची)',
    category: 'Immunity & Vitality',
    form: 'Tablet (Vati)',
    doshaAction: 'Tridosha Shamaka (Especially Pitta & Rakta)',
    ingredients: ['Guduchi Stem Extract (Tinospora cordifolia)'],
    indications: ['Chronic & recurrent low-grade fever (Jwara)', 'Allergic rhinitis', 'Immune dysregulation', 'High metabolic inflammation (Pitta)'],
    dosage: '1 to 2 tablets twice daily after meals with water',
    cautions: 'Generally very safe; monitor blood glucose levels if co-administering with anti-diabetic medications.',
    verified: true,
  },
  {
    id: 'tulsi-arka',
    name: 'Tulsi Arka (Holy Basil Drops)',
    classicalName: 'तुलसी अर्क',
    category: 'Respiratory & Cough',
    form: 'Distilled Liquid Extract (Arka)',
    doshaAction: 'Kapha-Vata Shamaka, Pitta Vardhaka in excess',
    ingredients: ['Rama Tulsi', 'Shyama Tulsi', 'Vana Tulsi (Ocimum sanctum)'],
    indications: ['Throat tickle & hoarseness', 'Seasonal nasal congestion', 'Cold sensitivity', 'Respiratory wellness'],
    dosage: '5 to 10 drops in a glass of warm water or green tea, twice daily',
    cautions: 'Avoid high doses if experiencing active acid peptic disease or internal bleeding.',
    verified: true,
  },
  {
    id: 'brahmi-vati',
    name: 'Brahmi Vati (Gold & Herb Form)',
    classicalName: 'ब्राह्मी वटी',
    category: 'Stress & Sleep',
    form: 'Classical Tablet',
    doshaAction: 'Pitta-Vata Shamaka (Medhya Rasayana)',
    ingredients: ['Brahmi (Bacopa monnieri)', 'Shankhpushpi', 'Vacha', 'Swarna Bhasma (Trace)'],
    indications: ['Mental fatigue & cognitive fog', 'Study exhaustion', 'High blood pressure tension', 'Restless mind at night'],
    dosage: '1 tablet twice daily with warm milk or honey water',
    cautions: 'To be taken under guidance of a licensed practitioner; avoid empty-stomach administration.',
    verified: true,
  },
  {
    id: 'chyawanprash',
    name: 'Classical Chyawanprash',
    classicalName: 'च्यवनप्राश अवलेह',
    category: 'Immunity & Vitality',
    form: 'Herbal Jam (Avaleha)',
    doshaAction: 'Tridosha Rasayana (Builds Ojas & Prana)',
    ingredients: ['Fresh Amalaki Pulp', 'Dashmoola (10 Roots)', 'Pippali', 'Guduchi', 'Bala', 'Honey & Sesame Oil'],
    indications: ['Seasonal illness vulnerability', 'Low cellular energy (Ojas kshaya)', 'Chest weakness', 'Geriatric & pediatric recovery'],
    dosage: '1 teaspoon (approx 10g) in the morning followed by warm milk or water',
    cautions: 'Avoid in acute indigestion, diarrhea, or uncontrolled diabetes without physician review.',
    verified: true,
  },
  {
    id: 'haridra-khanda',
    name: 'Haridra Khanda Granules',
    classicalName: 'हरिद्रा खण्ड',
    category: 'Immunity & Vitality',
    form: 'Granules (Khanda)',
    doshaAction: 'Kapha-Pitta Shamaka (Anti-allergic & Blood Purifier)',
    ingredients: ['Shuddha Haridra (Turmeric)', 'Cow Ghee', 'Milk', 'Pippali', 'Musta', 'Trivrit', 'Vidanga'],
    indications: ['Allergic urticaria & skin rashes (Sheetapitta)', 'Chronic rhinitis', 'Dust allergy flare-ups', 'Skin inflammation'],
    dosage: '3g to 6g twice daily with lukewarm milk or water',
    cautions: 'Avoid in gallbladder obstruction or active biliary stones.',
    verified: true,
  },
  {
    id: 'dashmoola-kashayam',
    name: 'Dashmoola Kashayam',
    classicalName: 'दशमूल कषायम्',
    category: 'Joint & Muscle',
    form: 'Concentrated Decoction',
    doshaAction: 'Potent Vata Shamaka',
    ingredients: ['Bilva', 'Agnimantha', 'Shyonaka', 'Patala', 'Gambhari', 'Brihati', 'Kantakari', 'Gokshura', 'Shalaparni', 'Prishniparni'],
    indications: ['Body aches & generalized stiffness', 'Post-viral fatigue & myalgia', 'Lower back discomfort (Kati shoola)', 'Postpartum recovery'],
    dosage: '15ml to 20ml diluted with 60ml warm water on empty stomach',
    cautions: 'Avoid during acute gastrointestinal inflammation or severe acidity without buffering food.',
    verified: true,
  },
  {
    id: 'avipattikar-churna',
    name: 'Avipattikar Churna',
    classicalName: 'अविपत्तिकर चूर्ण',
    category: 'Digestion & Agni',
    form: 'Powder (Churna)',
    doshaAction: 'Pitta Rechaka (Cooling Acidity Reliever)',
    ingredients: ['Trikatu', 'Triphala', 'Musta', 'Vidanga', 'Ela', 'Patra', 'Lavanga', 'Trivrit', 'Sharkara'],
    indications: ['Hyperacidity & heartburn (Amlapitta)', 'Acid reflux', 'Burning sensation in chest or throat', 'Bilious headache'],
    dosage: '3g to 5g before meals or at bedtime with cool water or coconut water',
    cautions: 'Not recommended for acute diarrhea or electrolyte depletion; contains Trivrit (mild laxative).',
    verified: true,
  },
  {
    id: 'shankhpushpi-syrup',
    name: 'Shankhpushpi Medhya Syrup',
    classicalName: 'शंखपुष्पी सिरप',
    category: 'Stress & Sleep',
    form: 'Herbal Syrup',
    doshaAction: 'Pitta-Vata Shamaka (Nervine Restorative)',
    ingredients: ['Shankhpushpi (Convolvulus pluricaulis)', 'Brahmi', 'Ashwagandha', 'Satva'],
    indications: ['Exam stress in students', 'Insomnia & restless sleep', 'Memory retention support', 'Mental agitation'],
    dosage: '10ml to 15ml twice daily with water',
    cautions: 'Keep bottle tightly sealed in a cool, dry place away from sunlight.',
    verified: true,
  },
  {
    id: 'trikatu-churna',
    name: 'Trikatu Churna (Three Pungents)',
    classicalName: 'त्रिकटु चूर्ण',
    category: 'Digestion & Agni',
    form: 'Pungent Powder',
    doshaAction: 'Kapha Shamaka & Agni Deepana (Stimulates Digestive Fire)',
    ingredients: ['Sunthi (Dry Ginger)', 'Maricha (Black Pepper)', 'Pippali (Long Pepper)'],
    indications: ['Loss of taste (Aruchi)', 'Heavy feeling after meals', 'Sluggish metabolism (Mandagni)', 'Excess mucous production in chest'],
    dosage: '1g to 2g with honey twice daily before or with meals',
    cautions: 'Contraindicated in stomach ulcers, gastritis, active heartburn, or burning urination (High Pitta).',
    verified: true,
  },
];

const CATEGORIES = [
  'All',
  'Respiratory & Cough',
  'Digestion & Agni',
  'Immunity & Vitality',
  'Stress & Sleep',
  'Joint & Muscle',
];

export default function MedicinesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredMedicines = useMemo(() => {
    return MEDICINES_DATA.filter((med) => {
      const matchesCategory =
        selectedCategory === 'All' || med.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!search.trim()) return true;

      const q = search.toLowerCase();
      const nameMatch = med.name.toLowerCase().includes(q);
      const classicalMatch = med.classicalName.toLowerCase().includes(q);
      const ingredientsMatch = med.ingredients.some((ing) => ing.toLowerCase().includes(q));
      const indicationsMatch = med.indications.some((ind) => ind.toLowerCase().includes(q));
      const doshaMatch = med.doshaAction.toLowerCase().includes(q);

      return nameMatch || classicalMatch || ingredientsMatch || indicationsMatch || doshaMatch;
    });
  }, [search, selectedCategory]);

  return (
    <div className="bg-[#04150E] min-h-[calc(100vh-4rem)] py-8 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-[#062016]/90 border border-[#124731] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Classical Pharmacopeia</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Medicines & Herbal Formulations Directory
            </h1>
            <p className="text-sm text-emerald-100/70 leading-relaxed">
              Explore evidence-backed Ayurvedic herbal formulations, classical powders (Churnas), extracts, and Rasayanas used in personalized pre-consultations and clinical prescriptions.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search formulation, herb, symptom…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#062016] border border-[#124731] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-emerald-100/40 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-[#062016] text-emerald-100/70 border border-[#124731] hover:text-white hover:bg-[#0B2E20]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((med) => (
            <div
              key={med.id}
              className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#124731] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                      {med.category} • {med.form}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {med.name}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">
                      {med.classicalName}
                    </p>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Verified ✓
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block mb-1">
                    Dosha Balance
                  </span>
                  <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 inline-block">
                    {med.doshaAction}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block mb-1">
                    Key Botanicals & Actives
                  </span>
                  <ul className="text-xs text-slate-300 space-y-0.5 pl-4 list-disc">
                    {med.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block mb-1">
                    Primary Indications
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {med.indications.map((ind, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-[#04150E] text-emerald-100/80 border border-[#124731] text-[11px]">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#04150E] rounded-xl border border-[#124731] space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-emerald-400" />
                    <span>Adult Dosage Guideline</span>
                  </span>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {med.dosage}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#124731] text-[11px] text-amber-300/90 flex items-start gap-1.5 bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>Caution: {med.cautions}</span>
              </div>
            </div>
          ))}

          {filteredMedicines.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs">
              <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-200 text-sm">No Formulations Match Your Search</p>
              <p className="text-slate-500 mt-1">
                Try searching by different terms like "cough", "Pitta", "digestive", or select "All" categories.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
