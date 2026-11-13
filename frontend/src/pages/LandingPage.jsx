import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, ChevronRight, Mic, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen text-slate-800">
      <section className="py-16 sm:py-24 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold">
                <span>Clinical Voice Pre-Consultation</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
                Voice-First Health Triage & OPD Consultation
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Describe symptoms by voice or text in Hindi or English. Sudha Setu assesses clinical urgency in real time, generates grounded wellness and dietary guidance, connects you to verified doctors, and triggers automated ambulance dispatch for emergencies.
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
                    className="btn-primary px-6 py-3 text-sm font-semibold shadow-sm"
                  >
                    <span>Open {user.role.toUpperCase()} Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/intake"
                      className="btn-primary px-6 py-3 text-sm font-semibold shadow-sm"
                    >
                      <span>Start Symptom Triage</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/login"
                      className="btn-secondary px-6 py-3 text-sm font-semibold"
                    >
                      <span>Clinician Sign In</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Hindi & English Voice Recognition
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> 3-Tier Clinical Safety Model
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> Automated Emergency Dispatch
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Intake Demo
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">hi-IN Audio Feed</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-teal-300 font-medium">
                      <Mic className="w-3.5 h-3.5 text-teal-400" /> Voice Input Transcribed
                    </span>
                    <span>Confidence: 98%</span>
                  </div>
                  <p className="text-sm text-slate-200 font-serif italic leading-relaxed">
                    "दो दिनों से तेज बुखार है, सिर में लगातार भारी दर्द है और गले में खराश है।"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Constitutional Pattern</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">Pitta-Vata Predominance</span>
                  </div>
                  <div className="p-2.5 bg-slate-800/50 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Metabolic Fire (Agni)</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">Tikshna (Intense)</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-950/40 border border-amber-600/40 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Tier 2: Medium Risk (Amber)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200">
                      Doctor OPD Queue
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed">
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
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Clinical Architecture</p>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            The 3-Tier Clinical Triage Engine
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every symptom description is evaluated against deterministic safety rules to prioritize emergency cases and reduce hospital wait times.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="badge-green font-semibold">Tier 1: Low Risk</span>
              <h3 className="text-lg font-bold text-slate-900">Verified Self-Care & Dietary Care</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mild, temporary symptoms receive authentic home remedies, dietary protocols (Ahara), and lifestyle balance tips with zero pharmaceutical intervention.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Instant audio TTS playback & downloadable consultation PDF.
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-amber-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="badge-amber font-semibold">Tier 2: Medium Risk</span>
              <h3 className="text-lg font-bold text-slate-900">Doctor OPD Priority Queue</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Persistent or severe symptoms stream directly into the licensed doctor consultation console with pre-extracted metabolic and constitutional markers.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Real-time WebSocket OPD alerts & clinical e-prescriptions.
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-rose-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="badge-red font-semibold">Tier 3: High Risk</span>
              <h3 className="text-lg font-bold text-slate-900">Emergency Hospital & Ambulance Dispatch</h3>
              <p className="text-xs text-rose-900 leading-relaxed">
                Critical triggers (cardiac flags, acute distress) auto-calculate the nearest hospital by GPS and immediately dispatch active ambulance units.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Immediate hospital routing & 112 national emergency link.
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Key Capabilities</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Engineered for Real Healthcare Workflows
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Multilingual Voice Input</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Speak naturally in Hindi or English. Web Speech synthesis and recognition provide accessible healthcare for elderly and non-technical patients.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Grounded Clinical Knowledge</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                RAG retrieval matches symptom tokens against verified clinical guidelines. Every recommendation embeds traceable reference citations.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-base">Hospital & Fleet Dispatch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated Haversine geolocation matches patients with nearest emergency medical centers while streaming coordinates to on-duty ambulances.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-slate-900">Explore Platform Consoles</h2>
          <span className="text-xs text-slate-400">Direct Role Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/intake"
            className="card hover:border-teal-400 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Patient Triage</h3>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Describe symptoms via voice or text with instant clinical categorization.
            </p>
          </Link>

          <Link
            to="/doctor/dashboard"
            className="card hover:border-teal-400 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Doctor OPD</h3>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live consultation queue with Agni, Prakriti, and digital prescriptions.
            </p>
          </Link>

          <Link
            to="/ambulance/dashboard"
            className="card hover:border-teal-400 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Emergency Fleet</h3>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time emergency run alerts, patient GPS routing, and status tracking.
            </p>
          </Link>

          <Link
            to="/admin/dashboard"
            className="card hover:border-teal-400 transition-all p-5 space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Admin Telemetry</h3>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform telemetry, doctor credentialing, and fleet orchestration.
            </p>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-slate-700">Sudha Setu • Voice Health Triage Platform</p>
          <p className="text-slate-400">Node.js • Express • MongoDB • Socket.IO • React • Web Speech API</p>
        </div>
      </footer>
    </div>
  );
}
