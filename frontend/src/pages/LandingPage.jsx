import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="flex flex-col bg-white min-h-screen text-slate-800">
      <div className="bg-slate-100 border-b border-slate-200 py-1.5 px-4 text-center text-xs text-slate-600">
        <span>Ministry of Ayush, Government of India • National Health Portal Integration • SIH26047</span>
      </div>

      <section className="border-b border-slate-200 bg-slate-50/60 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Ayush Digital Pre-Consultation Framework
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Voice-Enabled Ayurvedic Triage & Clinical Intake System
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                  A structured clinical gateway designed for public healthcare facilities. Patients state symptoms by voice or text in Hindi or English; the platform applies grounded clinical guidelines to categorize risk, prepares OPD case records, and coordinates emergency ambulance dispatch when critical symptoms are detected.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
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
                    className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white px-5 py-2.5 rounded text-sm font-semibold transition-colors"
                  >
                    <span>Open {user.role.toUpperCase()} Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/intake"
                      className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white px-5 py-2.5 rounded text-sm font-semibold transition-colors"
                    >
                      <span>Begin Patient Triage</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-5 py-2.5 rounded text-sm font-semibold transition-colors"
                    >
                      <span>Staff & Clinician Login</span>
                    </Link>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <dt className="text-slate-400 font-medium">Languages</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">Hindi & English</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Clinical Standard</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">3-Tier Ayush Safety</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Record Linkage</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">ABHA ID & PDF</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 font-medium">Emergency Link</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">Haversine GPS / 112</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sample Triage Record
                </span>
                <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  REF-2026-AY04
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase">Input Dialogue (Audio / Speech-to-Text)</p>
                  <p className="mt-1 p-2.5 bg-slate-50 rounded border border-slate-200 font-serif text-slate-800 italic">
                    "दो दिनों से तेज बुखार है, सिर में भारी दर्द है और हल्का गला खराब है।"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-400">Prakriti Suspected:</span>
                    <span className="font-bold text-slate-800 ml-1">Pitta-Vata</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-slate-400">Agni State:</span>
                    <span className="font-bold text-slate-800 ml-1">Tikshna</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase">Extracted Clinical Parameters</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">Fever (Severity 8/10)</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">Headache (Severity 7/10)</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">Sore Throat</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">Tier 2: Medium Risk (Amber)</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-950">OPD Queue</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Routed to Dr. Sharma (Kayachikitsa OPD) with retrieved Ayush Rule #KB-Jvara-02.
                  </p>
                </div>

                <div className="text-[11px] text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700">Immediate Action:</span> Patient placed in hospital consultation queue; dietary Shrita Sheeta Jala regimen provided.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Safety Architecture</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            The 3-Tier Clinical Triage Protocol
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Every patient input is evaluated through a deterministic risk-stratification matrix to avoid unnecessary hospital congestion while maintaining a zero-delay pipeline for emergencies.
          </p>
        </div>

        <div className="border border-slate-200 rounded divide-y divide-slate-200 bg-white">
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-3">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Tier 1 • Low Risk (Green)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Verified Self-Care & Ahara</h3>
            </div>
            <div className="md:col-span-5 text-sm text-slate-600 leading-relaxed">
              Mild, self-limiting discomfort. The system synthesizes classical Ayurvedic Ahara (dietary notes), Pathya/Apathya precautions, and safe home remedies without pharmaceutical intervention.
            </div>
            <div className="md:col-span-4 bg-slate-50 p-3 rounded border border-slate-100 text-xs space-y-1">
              <p className="font-semibold text-slate-800">Clinical Protocol Action:</p>
              <ul className="space-y-1 text-slate-600">
                <li>• Instant audio & text guidance (Web Speech TTS)</li>
                <li>• Classical Kwath and dietary advice generated</li>
                <li>• Verifiable PDF case summary issued</li>
              </ul>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-3">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Tier 2 • Medium Risk (Amber)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Doctor OPD Priority Queue</h3>
            </div>
            <div className="md:col-span-5 text-sm text-slate-600 leading-relaxed">
              Persistent fever, digestive derangements, or chronic flare-ups. Cases are forwarded directly into the licensed practitioner OPD console with pre-extracted Prakriti and Agni markers.
            </div>
            <div className="md:col-span-4 bg-slate-50 p-3 rounded border border-slate-100 text-xs space-y-1">
              <p className="font-semibold text-slate-800">Clinical Protocol Action:</p>
              <ul className="space-y-1 text-slate-600">
                <li>• Real-time WebSocket arrival alert to OPD desk</li>
                <li>• Grounding references cited for physician review</li>
                <li>• Official e-prescription recorded in patient file</li>
              </ul>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-3">
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200">
                Tier 3 • High Risk (Red)
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-2">Immediate SOS & Ambulance Dispatch</h3>
            </div>
            <div className="md:col-span-5 text-sm text-slate-600 leading-relaxed">
              Cardiac indicators, acute respiratory distress, severe hemorrhage, or neurological flags. Immediately triggers hospital geospatial discovery and dispatches on-duty ambulance units.
            </div>
            <div className="md:col-span-4 bg-slate-50 p-3 rounded border border-slate-100 text-xs space-y-1">
              <p className="font-semibold text-slate-800">Clinical Protocol Action:</p>
              <ul className="space-y-1 text-slate-600">
                <li>• Geolocation query identifies nearest hospital</li>
                <li>• WebSocket dispatch transmitted to active ambulance</li>
                <li>• Fullscreen emergency overlay with direct 112 dialing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Institutional Integration</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Built for Ayush Hospital Infrastructure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                RAG-Grounded Clinical Knowledge Base
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rather than unconstrained generic chat, the decision pipeline utilizes token-matched TF-IDF retrieval against a database of active Ayush board clinical rules. Citations are embedded into every generated assessment, allowing doctors to trace reasoning directly to documented classical guidelines.
              </p>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs font-mono text-slate-700">
                Reference format: [Ref: Rule &lt;KnowledgeBaseId&gt;]
              </div>
            </div>

            <div className="bg-white p-6 rounded border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-slate-900">
                ABDM & Emergency Fleet Connectivity
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connects patient ABHA IDs directly with consultation outputs. In critical scenarios, the platform uses real-time patient coordinates to query hospital collection coordinates via the Haversine formula, assigning the nearest medical center and dispatching available ambulance units.
              </p>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs font-mono text-slate-700">
                Real-time transport: Socket.IO rooms (ambulance, doctors)
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">System Access</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Portal Directory
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 border border-slate-200 rounded bg-white space-y-2">
            <p className="font-bold text-slate-900 text-sm">Patient Portal</p>
            <p className="text-slate-500 leading-relaxed">Voice & text intake in Hindi or English with automatic clinical triage and home care notes.</p>
            <Link to="/intake" className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-900 pt-1">
              <span>Start Intake</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 border border-slate-200 rounded bg-white space-y-2">
            <p className="font-bold text-slate-900 text-sm">Doctor Console</p>
            <p className="text-slate-500 leading-relaxed">Live OPD queue with Prakriti, Agni, and symptom markers, plus digital prescription signing.</p>
            <Link to="/doctor/dashboard" className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-900 pt-1">
              <span>Open OPD Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 border border-slate-200 rounded bg-white space-y-2">
            <p className="font-bold text-slate-900 text-sm">Ambulance Fleet</p>
            <p className="text-slate-500 leading-relaxed">Emergency run alerts with patient GPS coordinates, hospital routing, and status tracking.</p>
            <Link to="/ambulance/dashboard" className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-900 pt-1">
              <span>View Dispatches</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 border border-slate-200 rounded bg-white space-y-2">
            <p className="font-bold text-slate-900 text-sm">Admin & Telemetry</p>
            <p className="text-slate-500 leading-relaxed">National Ayush telemetry, doctor credentials verification, and ambulance allocation.</p>
            <Link to="/admin/dashboard" className="inline-flex items-center gap-1 font-semibold text-teal-800 hover:text-teal-900 pt-1">
              <span>Admin Telemetry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800">Sudha Setu (सुधा सेतु) • SIH26047</p>
            <p className="text-slate-500 mt-0.5">Ministry of Ayush • Ayurvedic Voice Triage & Emergency Pre-Consultation</p>
          </div>
          <div className="text-slate-400 text-[11px]">
            Node.js • Express • MongoDB • Socket.IO • React • Web Speech API
          </div>
        </div>
      </footer>
    </div>
  );
}
