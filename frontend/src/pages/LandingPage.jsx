import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, ChevronRight, Mic, CheckCircle2, ShieldCheck, Activity, Stethoscope, Truck, Database } from 'lucide-react';

export default function LandingPage() {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="flex flex-col bg-[#0B0F19] min-h-screen text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800/80 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Next-Gen Voice Health Triage</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Intelligent Voice Triage & <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Clinical Care</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
                Describe symptoms by voice or text in Hindi or English. Sudha Setu performs instant clinical risk evaluation, generates personalized dietary regimens, streams critical cases to doctors, and dispatches ambulances for high-risk emergencies.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {user ? (
                  <Link
                    to={
                      user.role === 'admin'
                        ? '/admin/dashboard'
                        : user.role === 'ambulance'
                        ? '/ambulance/dashboard'
                        : ['doctor', 'support'].includes(user.role)
                        ? '/doctor/dashboard'
                        : '/intake'
                    }
                    className="btn-primary px-6 py-3.5 text-sm font-semibold shadow-lg shadow-emerald-500/20"
                  >
                    <span>Launch {user.role.toUpperCase()} Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/intake"
                      className="btn-primary px-6 py-3.5 text-sm font-semibold shadow-lg shadow-emerald-500/20"
                    >
                      <span>Start Symptom Triage</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/login"
                      className="btn-secondary px-6 py-3.5 text-sm font-semibold"
                    >
                      <span>Clinician Portal</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hindi & English Voice
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3-Tier Clinical Safety
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automated Fleet Dispatch
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-6 shadow-2xl border border-slate-800 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Clinical Intake
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">hi-IN Audio Feed</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <Mic className="w-3.5 h-3.5" /> Voice Input Transcribed
                    </span>
                    <span className="text-emerald-400 font-mono">98.4% Confidence</span>
                  </div>
                  <p className="text-sm text-slate-200 italic leading-relaxed">
                    "दो दिनों से तेज बुखार है, सिर में लगातार भारी दर्द है और गले में खराश है।"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Constitutional Pattern</span>
                    <span className="font-bold text-emerald-300 mt-0.5 block">Pitta-Vata Predominance</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block">Metabolic State (Agni)</span>
                    <span className="font-bold text-amber-300 mt-0.5 block">Tikshna (Intense)</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Tier 2: Medium Risk (Amber)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                      Doctor OPD Queue
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    Symptom severity requires human physician review. Queued to Dr. Sharma with verified clinical dietary regimen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Clinical Architecture</p>
          <h2 className="text-3xl font-black text-white tracking-tight">
            The 3-Tier Clinical Triage Engine
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every symptom description is evaluated against deterministic safety rules to prioritize emergency cases and reduce hospital wait times.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 rounded-xl border border-emerald-500/30 p-6 shadow-xl shadow-black/20 backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-colors">
            <div className="space-y-3">
              <span className="badge-green font-semibold">Tier 1: Low Risk</span>
              <h3 className="text-lg font-bold text-white">Verified Self-Care & Dietary Guidance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mild, temporary symptoms receive authentic home remedies, dietary protocols (Ahara), and lifestyle balance tips with zero pharmaceutical intervention.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              Instant audio voice playback & downloadable consultation PDF.
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-amber-500/40 p-6 shadow-xl shadow-black/20 backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-amber-500/60 transition-colors">
            <div className="space-y-3">
              <span className="badge-amber font-semibold">Tier 2: Medium Risk</span>
              <h3 className="text-lg font-bold text-white">Doctor OPD Priority Queue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persistent or severe symptoms stream directly into the licensed doctor consultation console with pre-extracted metabolic and constitutional markers.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              Real-time WebSocket OPD alerts & clinical e-prescriptions.
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl border border-rose-500/40 p-6 shadow-xl shadow-black/20 backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-rose-500/60 transition-colors">
            <div className="space-y-3">
              <span className="badge-red font-semibold">Tier 3: High Risk</span>
              <h3 className="text-lg font-bold text-white">Emergency Hospital & Fleet Dispatch</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Critical triggers (cardiac flags, acute distress) auto-calculate the nearest hospital by GPS and immediately dispatch active ambulance units.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400">
              Immediate hospital routing & 112 emergency hotline link.
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Core Capabilities</p>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Engineered for Modern Clinical Workflows
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5 p-6 bg-slate-900/40 rounded-xl border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Multilingual Voice Input</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Speak naturally in Hindi or English. Web Speech synthesis and recognition provide accessible healthcare for diverse patient demographics.
              </p>
            </div>

            <div className="space-y-2.5 p-6 bg-slate-900/40 rounded-xl border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Grounded Clinical Knowledge</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                RAG retrieval matches symptom tokens against verified clinical guidelines. Every recommendation embeds traceable reference citations.
              </p>
            </div>

            <div className="space-y-2.5 p-6 bg-slate-900/40 rounded-xl border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">Hospital & Fleet Dispatch</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated Haversine geolocation matches patients with nearest emergency medical centers while streaming coordinates to on-duty ambulances.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white">Explore Platform Consoles</h2>
          <span className="text-xs text-slate-500 font-mono">Role Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/intake"
            className="card hover:border-emerald-500/50 hover:bg-slate-900 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">Patient Triage</h3>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe symptoms via voice or text with instant clinical categorization.
            </p>
          </Link>

          <Link
            to="/medicines"
            className="card hover:border-emerald-500/50 hover:bg-slate-900 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">Medicines Directory</h3>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browse classical Churnas, Rasayanas, active botanicals, and clinical indications.
            </p>
          </Link>

          <Link
            to="/providers"
            className="card hover:border-teal-500/50 hover:bg-slate-900 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors">Doctors & Fleet</h3>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live roster of verified practitioners and active emergency ambulance vehicles.
            </p>
          </Link>

          <Link
            to="/doctor/dashboard"
            className="card hover:border-emerald-500/50 hover:bg-slate-900 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">Doctor OPD</h3>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Live consultation queue with Agni, Prakriti, and digital prescriptions.
            </p>
          </Link>

          <Link
            to="/admin/dashboard"
            className="card hover:border-teal-500/50 hover:bg-slate-900 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors">Admin Console</h3>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platform telemetry, doctor credentialing, and fleet orchestration.
            </p>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold text-slate-300">Sudha Setu • Voice Health Triage Platform</p>
          <p className="text-slate-500">MERN Stack • Socket.IO • Web Speech API • Clinical Safety Protocol</p>
        </div>
      </footer>
    </div>
  );
}
