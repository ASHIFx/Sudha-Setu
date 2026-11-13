import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, AlertTriangle, ShieldCheck, HeartPulse, ArrowRight, Activity, BookOpen } from 'lucide-react';

const DISEASES_DATA = [
  {
    id: 'sandhigata-vata',
    name: 'Osteoarthritis & Joint Stiffness',
    classicalName: 'संधिगत वात (Sandhigata Vata)',
    dosha: 'Vata Imbalance',
    doshaColor: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    description: 'Degenerative joint disease caused by aggravated Vata drying up Shleshaka Kapha (synovial fluid), leading to crepitus, friction, and morning stiffness.',
    symptoms: ['Joint stiffness especially in cold weather', 'Crepitus (clicking sound in knees)', 'Swelling with dull aching pain', 'Difficulty climbing stairs'],
    remedies: ['Yograj Guggulu (2 tabs twice daily)', 'Shallaki (Boswellia serrata) extract', 'Mahanarayan Taila local application', 'Ashwagandha Rasayana with warm milk'],
    dietary: 'Favor warm cooked soups, sesame oil, ghee, and garlic. Avoid cold, dry, frozen foods and excessive raw salads.',
    lifestyle: 'Daily gentle joint rotation (Sukshma Vyayama), hot fomentation (Janu Basti), and avoiding sudden weight-bearing shocks.',
    redFlags: 'Sudden joint lockup, inability to bear weight, hot erythema, or high fever with joint swelling.',
  },
  {
    id: 'amlapitta',
    name: 'Hyperacidity & Acid Reflux (GERD)',
    classicalName: 'अम्लपित्त (Amlapitta)',
    dosha: 'Pitta Imbalance',
    doshaColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    description: 'Pathological sour and pungent increase in Pachaka Pitta causing burning sensation in chest, sour belching, and gastric mucosa inflammation.',
    symptoms: ['Retrosternal heartburn (Hrid-daha)', 'Sour or bitter eructation (Amla-udgara)', 'Nausea after spicy foods', 'Headache associated with indigestion'],
    remedies: ['Avipattikar Churna (3g with coconut water)', 'Kamadudha Rasa (Mukta yukta)', 'Amalaki Churna before meals', 'Shatavari Ghritham'],
    dietary: 'Favor cooling foods: sweet pomegranates, bottle gourd, soaked fennel seeds, and coconut water. Avoid deep-fried, sour curd, vinegar, and red chillies.',
    lifestyle: 'Never skip meals; avoid late-night heavy dinners; elevate head while sleeping; practice Shitali Pranayama.',
    redFlags: 'Vomiting blood (coffee-ground emesis), black tarry stools, or crushing chest pain radiating to left arm (rule out acute MI).',
  },
  {
    id: 'kasa-shwasa',
    name: 'Bronchial Asthma & Chronic Cough',
    classicalName: 'कास एवं श्वास (Kasa & Shwasa)',
    dosha: 'Kapha-Vata Imbalance',
    doshaColor: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
    description: 'Obstruction of Pranavaha Srotas by thick Kapha, redirecting Prana Vayu upwards and triggering paroxysmal coughing and wheezing.',
    symptoms: ['Nocturnal coughing spells', 'Wheezing during exhalation', 'Chest tightness upon cold exposure', 'Thick mucoid expectoration'],
    remedies: ['Sitopaladi Churna mixed with equal honey and ghee', 'Kanthakari Avaleha', 'Trikatu Churna (pinch in ginger tea)', 'Vasavaleha (Adhatoda vasica)'],
    dietary: 'Favor warm fluids, boiled ginger water, black pepper, and aged honey. Strictly avoid chilled beverages, ice cream, bananas at night, and yogurt.',
    lifestyle: 'Chest fomentation with warm sesame oil and rock salt; steam inhalation with eucalyptus; avoid dusty or damp climates.',
    redFlags: 'Stridor, severe cyanosis (blue lips), inability to complete sentences in one breath, or oxygen saturation dropping below 94%.',
  },
  {
    id: 'jwara',
    name: 'Acute Pyrexia & Viral Fevers',
    classicalName: 'ज्वर (Jwara)',
    dosha: 'Pitta-Vata (Ama Induced)',
    doshaColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    description: 'Systemic metabolic heat displacement caused by Ama (endotoxins) blocking Rasavaha channels and elevating core body temperature.',
    symptoms: ['Body-wide aches and chills', 'Anorexia (Aruchi) and coated tongue', 'Thirst with elevated body temperature', 'Malaise and fatigue'],
    remedies: ['Giloy Ghanvati (Guduchi) 2 tablets twice daily', 'Maha Sudarshan Ghanvati', 'Amritarishta (15ml with water)', 'Shadanga Paniya herbal decoction'],
    dietary: 'Fasting or light Moong dal soup (Yusha) and roasted puffed rice. Avoid heavy dairy, oils, wheat, and solid foods until digestion rekindles.',
    lifestyle: 'Complete bed rest in a well-ventilated room; sponging with room-temperature water; avoid direct air conditioner blast.',
    redFlags: 'High-grade fever (>103°F) unyielding to antipyretics, altered sensorium, stiff neck, petechial rash, or persistent vomiting.',
  },
  {
    id: 'prameha',
    name: 'Metabolic Syndrome & Prediabetes',
    classicalName: 'प्रमेह (Prameha)',
    dosha: 'Kapha-Pitta Imbalance',
    doshaColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    description: 'Disorder of Medas (adipose tissue) and Kleda (excess moisture) impairing insulin sensitivity and microvascular health.',
    symptoms: ['Frequent urination especially at night (Prabhuta Mutrata)', 'Excessive sweet craving and thirst', 'Burning sensation in soles and palms', 'Post-meal fatigue and brain fog'],
    remedies: ['Nisha-Amalaki Churna (Turmeric + Amla)', 'Chandraprabha Vati (2 tablets twice daily)', 'Jambu Beeja Churna (Jamun seed powder)', 'Vijaysar Kwath (Pterocarpus marsupium)'],
    dietary: 'Favor barley (Yava), millets (Ragi, Jowar), bitter gourd (Karela), fenugreek seeds, and Indian gooseberry. Eliminate refined sugar and polished white rice.',
    lifestyle: 'Daily 45 minutes brisk walking, Surya Namaskar, Kapalbhati pranayama, and avoiding daytime napping.',
    redFlags: 'Ketotic fruity breath, non-healing foot ulcers, sudden vision blur, or rapid unexplained weight loss.',
  },
  {
    id: 'twak-roga',
    name: 'Psoriasis & Chronic Dermatitis',
    classicalName: 'त्वक रोग / कुष्ठ (Kushtha & Twak Roga)',
    dosha: 'Pitta-Kapha (Rakta Dusti)',
    doshaColor: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    description: 'Chronic inflammation of skin layers (Twacha, Rakta, Mamsa) characterized by accelerated keratinocyte proliferation and itching.',
    symptoms: ['Silvery scale plaques on elbows/knees', 'Intense nocturnal pruritus (itching)', 'Erythematous skin lesions', 'Dryness and bleeding fissures'],
    remedies: ['Khadirarishta (20ml after meals)', 'Mahatiktaka Ghrita', 'Kaishore Guggulu', 'Gandhak Rasayana (purified sulfur formulation)'],
    dietary: 'Favor bitter and astringent tastes: neem leaves, turmeric, bottle gourd, and pomegranate. Strictly avoid incompatible foods (Viruddha Ahara like milk with fish).',
    lifestyle: 'Topical application of Karanja or Neem oil; avoid synthetic harsh detergents; practice stress-reducing meditation.',
    redFlags: 'Erythroderma covering >90% body surface, secondary bacterial cellulitis with pus discharge, or systemic fever.',
  },
  {
    id: 'nidranasha',
    name: 'Insomnia & Sleep Fragmentation',
    classicalName: 'निद्रानाश (Nidranasha)',
    dosha: 'Vata-Pitta Predominance',
    doshaColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    description: 'Depletion of Tarpaka Kapha and hyperactivity of Prana Vayu leading to heightened nervous arousal and failure to initiate restorative deep sleep.',
    symptoms: ['Difficulty falling asleep beyond 45 minutes', 'Waking up unrefreshed with grogginess', 'Restless legs and racing thoughts at midnight', 'Daytime irritability and memory lapses'],
    remedies: ['Brahmi Vati (1 tablet with warm milk)', 'Ashwagandha Churna at bedtime', 'Tagara (Valeriana wallichii) extract', 'Saraswatarishta'],
    dietary: 'Warm cow milk with a pinch of nutmeg and crushed almonds before sleep. Avoid caffeinated drinks, energy sodas, or nicotine past 4 PM.',
    lifestyle: 'Padabhyanga (warm sesame oil foot massage before sleep), Shirodhara therapy, digital device disconnection 1 hour before bed.',
    redFlags: 'Severe depressive ideation, hallucinations from prolonged sleep deprivation, or sleep apnea with choking gasps.',
  },
  {
    id: 'shirahshoola',
    name: 'Migraine & Tension Headache',
    classicalName: 'शिरःशूल / अर्धावभेदक (Shirahshoola)',
    dosha: 'Vata-Pitta Imbalance',
    doshaColor: 'border-red-500/30 bg-red-500/10 text-red-300',
    description: 'Neuro-vascular spasm triggered by Vata-Pitta aggravation in cranial channels, producing unilateral throbbing pain, photophobia, and nausea.',
    symptoms: ['Hemicranial (one-sided) throbbing pain', 'Sensitivity to bright lights and loud sounds', 'Visual aura or shimmering spots', 'Nausea exacerbated by direct sun exposure'],
    remedies: ['Pathyadi Kwath (20ml twice daily)', 'Godanti Bhasma with honey', 'Shirashuladi Vajra Rasa', 'Anu Taila Nasya (2 drops in each nostril)'],
    dietary: 'Drink soaked coriander and cumin seed water; eat sweet fruits; avoid aged cheese, fermented vinegar, processed chocolate, and sour pickles.',
    lifestyle: 'Protect head from direct hot sun and cold winds; maintain consistent meal times; practice gentle cooling breathing (Sheetali).',
    redFlags: 'Thunderclap headache ("worst headache of life"), focal neurological deficits (facial drooping, slurred speech), or headache with stiff neck.',
  },
  {
    id: 'grahani',
    name: 'IBS & Digestive Malabsorption',
    classicalName: 'ग्रहणी रोग (Grahani Roga)',
    dosha: 'Sama-Vata & Mandagni',
    doshaColor: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    description: 'Weakness of the duodenum and small bowel (Grahani) characterized by alternate bouts of loose watery stools and hard constipation with unassimilated food particles.',
    symptoms: ['Alternate diarrhea and constipation', 'Post-prandial abdominal cramping', 'Gurgling sound in abdomen (Antra-kujana)', 'Mucus in stool with chronic lethargy'],
    remedies: ['Kutajarishta (20ml after meals)', 'Bilwadi Churna (Bael fruit powder)', 'Takrarishta (fermented buttermilk tonic)', 'Mustakarishta (Cyperus rotundus)'],
    dietary: 'Buttermilk processed with roasted cumin, rock salt, and curry leaves (Takra is supreme therapy in Grahani). Avoid raw salads, whole lentils, and fried foods.',
    lifestyle: 'Eat only when previous meal is digested; practice Pavanamuktasana; manage autonomic gut-brain axis stress with Pranayama.',
    redFlags: 'Unintentional rapid weight loss, rectal bleeding, nocturnal diarrhea waking patient from sleep, or anemia.',
  },
  {
    id: 'hridroga',
    name: 'Hypertension & Cardiac Wellness',
    classicalName: 'हृद्रोग एवं उच्च रक्तचाप (Hridroga)',
    dosha: 'Vata-Rakta Predominance',
    doshaColor: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
    description: 'Arterial resistance and cardiovascular stress resulting from Vyana Vayu disturbance and metabolic plaque (Ama-Rakta) narrowing vascular channels.',
    symptoms: ['Elevated systolic/diastolic BP', 'Occipital morning throbbing', 'Palpitations during emotional stress', 'Mild exertional shortness of breath'],
    remedies: ['Arjunarishta (Terminalia arjuna tonic) 20ml twice daily', 'Sarpagandha Ghanvati (under clinical supervision)', 'Hridayarnava Rasa', 'Mukta Pishti'],
    dietary: 'Low-sodium diet, bottle gourd juice, garlic infused warm water, pomegranate, and flaxseeds. Avoid excessive table salt, pickles, and cured meats.',
    lifestyle: 'Daily 30 minutes walking, Anulom Vilom pranayama, progressive muscle relaxation, and avoidance of sudden anger or agitation.',
    redFlags: 'Crushing central chest pain, radiation to left arm or jaw, cold diaphoresis (sweating), or sudden syncope (call 112 immediately).',
  },
  {
    id: 'sthaulya',
    name: 'Obesity & Dyslipidemia',
    classicalName: 'स्थौल्य (Sthaulya / Medoroga)',
    dosha: 'Kapha & Medas Overaccumulation',
    doshaColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    description: 'Blockage of Medovaha Srotas by vitiated Kapha and Medas, trapping nutrition in fat tissue while depriving bone and muscle tissue.',
    symptoms: ['Excess abdominal adiposity', 'Exertional breathlessness', 'Excessive sweating with body odor', 'Ravenous appetite paired with low energy'],
    remedies: ['Medohar Guggulu (2 tabs twice daily)', 'Varunadi Kwath', 'Vidangadi Churna', 'Triphala Guggulu with lukewarm honey water'],
    dietary: 'Barley (Jau), roasted horsegram soup (Kulatthi Yusha), bitter greens, and warm water. Avoid deep fried foods, sweets, cheese, and daytime sleep.',
    lifestyle: 'Udwarthana (dry herbal powder scrub massage with Kolakulathadi), vigorous morning cardio, and intermittent fasting under guidance.',
    redFlags: 'Severe sleep apnea with oxygen desaturation, cardiac dyspnea on minimal steps, or suspected pulmonary thromboembolism.',
  },
  {
    id: 'gridhrasi',
    name: 'Sciatica & Lumbar Radiculopathy',
    classicalName: 'गृध्रसी (Gridhrasi)',
    dosha: 'Vata or Vata-Kapha',
    doshaColor: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    description: 'Compression and inflammation of the sciatic nerve manifesting as shooting radiating pain from the lumbar spine down through thigh, calf, and heel.',
    symptoms: ['Shooting electric pain down one leg', 'Numbness or tingling in foot and toes', 'Difficulty straightening knee while walking', 'Lumbar stiffness on waking'],
    remedies: ['Trayodashang Guggulu (2 tabs twice daily)', 'Rasnadi Kwath', 'Dashmoola Taila Kati Basti', 'Brihat Vata Chintamani Rasa'],
    dietary: 'Warm nourishing soups, cow ghee, garlic, and ginger. Avoid dry crackers, cold foods, chickpeas, and carbonated beverages.',
    lifestyle: 'Kati Basti (warm oil reservoir on lumbar spine), gentle spinal decompression, avoiding lifting heavy weights with bent back.',
    redFlags: 'Cauda equina syndrome: loss of bladder or bowel control, saddle anesthesia (numbness in groin), or sudden foot drop.',
  },
];

export default function DiseasesPage() {
  const [search, setSearch] = useState('');
  const [selectedDosha, setSelectedDosha] = useState('all');
  const navigate = useNavigate();

  const filteredDiseases = useMemo(() => {
    return DISEASES_DATA.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.classicalName.toLowerCase().includes(search.toLowerCase()) ||
        d.symptoms.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchDosha =
        selectedDosha === 'all' || d.dosha.toLowerCase().includes(selectedDosha.toLowerCase());

      return matchSearch && matchDosha;
    });
  }, [search, selectedDosha]);

  const handleConsultAI = (disease) => {
    navigate('/intake', { state: { prefilledText: `I am experiencing symptoms related to ${disease.name} (${disease.classicalName}): ${disease.symptoms.slice(0, 2).join(', ')}.` } });
  };

  return (
    <div className="bg-[#04150E] min-h-[calc(100vh-4rem)] py-8 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-[#062016]/90 border border-[#124731] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ayurvedic Clinical Pharmacopeia & Disease Atlas</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Diseases & Classical Clinical Guidance
            </h1>
            <p className="text-sm text-emerald-100/70 leading-relaxed">
              Explore authentic Ayurvedic diagnostics on 15+ acute and chronic conditions. Review primary Dosha imbalances, classical herbal formulations, dietary (Ahara) and lifestyle (Vihara) protocols, and clinical red flags.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search diseases, classical names, symptoms..."
              className="w-full bg-[#062016] border border-[#124731] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-emerald-100/40 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'Vata', 'Pitta', 'Kapha'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDosha(d)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  selectedDosha === d
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-[#062016] text-emerald-100/70 border-[#124731] hover:text-white hover:bg-[#0B2E20]'
                }`}
              >
                {d === 'all' ? 'All Imbalances' : `${d} Predominant`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDiseases.map((d) => (
            <div
              key={d.id}
              className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-5 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${d.doshaColor}`}>
                      {d.dosha}
                    </span>
                    <h2 className="text-lg font-serif font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors">
                      {d.name}
                    </h2>
                    <p className="text-xs text-emerald-400 font-medium">{d.classicalName}</p>
                  </div>
                </div>

                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  {d.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-[#124731]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Key Symptoms
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    {d.symptoms.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#124731]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Classical Formulations & Herbs
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {d.remedies.map((r, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-200 border border-emerald-500/20"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-300 text-[11px] font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Clinical Red Flags</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    {d.redFlags}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#124731]">
                <button
                  type="button"
                  onClick={() => handleConsultAI(d)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer group-hover:scale-[1.01]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Consult Charak Vaani AI</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}