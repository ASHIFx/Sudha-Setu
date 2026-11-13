import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, Stethoscope, Building2, HeartPulse, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleAskAI = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      navigate('/intake');
      return;
    }

    const qLower = query.toLowerCase();
    if (qLower.includes('doctor') || qLower.includes('vaidya')) {
      navigate('/doctors');
    } else if (qLower.includes('hospital') || qLower.includes('clinic') || qLower.includes('panchakarma')) {
      navigate('/hospitals');
    } else if (qLower.includes('medicine') || qLower.includes('churna') || qLower.includes('vati')) {
      navigate('/medicines');
    } else {
      navigate('/intake', { state: { prefilledText: query } });
    }
  };

  const handlePopularChip = (label, action) => {
    if (action === 'doctors') navigate('/doctors');
    else if (action === 'hospitals') navigate('/hospitals');
    else if (action === 'medicines') navigate('/medicines');
    else if (action === 'intake') navigate('/intake');
    else {
      setSearchQuery(label);
      navigate('/intake', { state: { prefilledText: `I am experiencing ${label}. Please assess my symptoms.` } });
    }
  };

  return (
    <div className="bg-[#04150E] min-h-[calc(100vh-4rem)] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8">
        <div className="bg-[#062016]/90 border border-[#124731] rounded-3xl p-6 sm:p-10 lg:p-12 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-0" />

          <div className="max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B2E20] border border-[#1A5C40] text-emerald-300 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AYURVEDA × TECHNOLOGY × A HEALTHIER TOMORROW</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15]">
              Bridging Wisdom With Intelligent Healthcare
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/70 max-w-2xl leading-relaxed">
              Turning ancient Ayurvedic wisdom into clearer health understanding. Consult our AI assistant, explore verified doctors, hospitals, and classical remedies.
            </p>

            <form onSubmit={handleAskAI} className="pt-2">
              <div className="relative flex items-center max-w-2xl bg-[#04150E]/90 border border-[#124731] focus-within:border-emerald-500/70 rounded-2xl p-1.5 shadow-2xl transition-colors">
                <Search className="w-5 h-5 text-emerald-400/60 ml-3.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symptoms (e.g. knee pain, acidity), doctors, or remedies..."
                  className="w-full bg-transparent border-none px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-emerald-100/40 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Ask AI</span>
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] mr-1">
                POPULAR:
              </span>
              {[
                { label: 'Joint Stiffness', action: 'symptom' },
                { label: 'Hyperacidity', action: 'symptom' },
                { label: 'Find Doctors', action: 'doctors' },
                { label: 'Panchakarma', action: 'hospitals' },
                { label: 'Herbal Medicines', action: 'medicines' },
                { label: 'Ask Charak AI', action: 'intake' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handlePopularChip(chip.label, chip.action)}
                  className="px-3 py-1 rounded-lg bg-[#062016] hover:bg-[#0B2E20] text-emerald-100/80 hover:text-white border border-[#124731] hover:border-emerald-500/40 transition-colors text-xs font-medium cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            to="/intake"
            className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  VOICE & TEXT AI
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                Charak Vaani
              </h2>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                AI consultation for real-time symptom analysis, dosha prakriti balance, and personalized home remedies.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-emerald-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>Start Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/doctors"
            className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  VERIFIED NETWORK
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                Ayurveda Doctors
              </h2>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Find experienced BAMS & MD Ayurvedic practitioners by specialty, city, and consultation fee.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-emerald-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>Browse Doctors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/hospitals"
            className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  NABH & CLINICS
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                Ayurveda Hospitals
              </h2>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Explore premier Ayurvedic healthcare centers, specialized Panchakarma clinics, and wellness retreats.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-emerald-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>Explore Hospitals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/diseases"
            className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  CLINICAL DIRECTORY
                </span>
              </div>
              <h2 className="text-lg font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                Diseases & Symptoms
              </h2>
              <p className="text-xs text-emerald-100/70 leading-relaxed">
                Authentic guidance on 15+ acute & chronic conditions with dosha imbalances, remedies, and red flags.
              </p>
            </div>
            <div className="pt-2 flex items-center text-xs font-bold text-emerald-400 gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>View Atlas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      <nav className="w-full border-t border-[#124731] bg-[#062016]/95 backdrop-blur-md py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center sm:justify-between gap-2 overflow-x-auto">
          <Link
            to="/"
            className="px-6 py-2 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 transition-all whitespace-nowrap"
          >
            Home
          </Link>

          <Link
            to="/hospitals"
            className="px-5 py-2 rounded-full text-xs font-semibold text-emerald-100/70 hover:text-white hover:bg-[#0B2E20] transition-colors whitespace-nowrap"
          >
            Hospitals
          </Link>

          <Link
            to="/doctors"
            className="px-5 py-2 rounded-full text-xs font-semibold text-emerald-100/70 hover:text-white hover:bg-[#0B2E20] transition-colors whitespace-nowrap"
          >
            Doctors
          </Link>

          <Link
            to="/diseases"
            className="px-5 py-2 rounded-full text-xs font-semibold text-emerald-100/70 hover:text-white hover:bg-[#0B2E20] transition-colors whitespace-nowrap"
          >
            Diseases
          </Link>

          <Link
            to="/medicines"
            className="px-5 py-2 rounded-full text-xs font-semibold text-emerald-100/70 hover:text-white hover:bg-[#0B2E20] transition-colors whitespace-nowrap"
          >
            Medicines
          </Link>
        </div>
      </nav>
    </div>
  );
}