import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Mic,
  ShieldCheck,
  Globe,
  ArrowRight,
  HeartPulse,
  Leaf,
  Sparkles,
  Truck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
} from 'lucide-react';

const TRIAGE_TIERS = [
  {
    tier: 'Tier 1: Low Risk (Green)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    title: 'Verified Ayurvedic Self-Care',
    description:
      'Mild symptoms receive authenticated home remedies, Ahara (dietary) notes, and Dinacharya (lifestyle) guidance vetted by licensed practitioners.',
    features: ['Dietary Kwath recipes', 'Prakriti balance tips', 'Downloadable advice summary'],
    icon: <Leaf className="w-6 h-6 text-emerald-600" />,
  },
  {
    tier: 'Tier 2: Medium Risk (Amber)',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    title: 'Doctor OPD Priority Queue',
    description:
      'Persistent or complex symptoms are routed to verified Kayachikitsa doctors with automated AI extraction of Agni, Prakriti, and reported symptoms.',
    features: ['Instant OPD queuing', 'RAG-grounded rule tracing', 'Doctor digital prescription'],
    icon: <Activity className="w-6 h-6 text-amber-600" />,
  },
  {
    tier: 'Tier 3: High Risk (Red)',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    title: 'SOS Ambulance & Hospital Dispatch',
    description:
      'Critical triggers immediately alert nearest emergency-capable hospitals and dispatch on-duty ambulance units with real-time patient coordinates.',
    features: ['Nearest hospital geolocation', 'Real-time WebSocket dispatch', '112 national emergency link'],
    icon: <AlertTriangle className="w-6 h-6 text-rose-600" />,
  },
];

const PLATFORM_PILLARS = [
  {
    icon: <Mic className="w-6 h-6 text-teal-600" />,
    title: 'Voice-First Hindi & English',
    desc: 'Speak naturally in Hindi or English. Built specifically for rural citizens, elderly patients, and low-literacy users.',
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
    title: 'Grounded RAG Clinical Engine',
    desc: 'Every AI response references and cites active Ayush Clinical Knowledge Base rules so doctors can trace and verify recommendations.',
  },
  {
    icon: <Building2 className="w-6 h-6 text-teal-600" />,
    title: 'Hospital & Fleet Orchestration',
    desc: 'Emergency dispatch finds nearest hospitals via geospatial distance and tracks ambulance unit acceptance in real time.',
  },
  {
    icon: <FileCheck className="w-6 h-6 text-teal-600" />,
    title: 'ABHA & Ayush Digital Health',
    desc: 'Integrates patient ABHA IDs, produces standardized case sheets, and generates verifiable PDF consultation summaries.',
  },
];

export default function LandingPage() {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white pt-16 pb-24 border-b border-teal-900/40">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-teal-500 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-emerald-500 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Smart India Hackathon SIH26047 • Ministry of Ayush, Govt. of India
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-5xl mx-auto leading-tight sm:leading-none">
            Intelligent Ayurvedic Voice Triage & Emergency Pre-Consultation
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Connecting citizens to authenticated Ayush OPDs in seconds. Speak your symptoms in{' '}
            <span className="text-teal-300 font-semibold">Hindi or English</span>, receive immediate 3-tier clinical triage, and trigger automated ambulance dispatch when critical.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
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
                className="btn bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3.5 text-base font-bold shadow-lg shadow-teal-500/20"
              >
                Go to Your Console <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn bg-teal-500 hover:bg-teal-400 text-slate-950 px-8 py-3.5 text-base font-bold shadow-lg shadow-teal-500/20"
                >
                  Start Patient Intake <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn border border-slate-700 hover:bg-slate-800 text-white px-8 py-3.5 text-base font-semibold"
                >
                  Clinical Staff Login
                </Link>
              </>
            )}
          </div>

          <div className="pt-8 max-w-5xl mx-auto">
            <div className="bg-slate-900/90 border border-teal-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl text-left grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Voice & Dialect Ready</h4>
                  <p className="text-xs text-slate-400 mt-1">Automatic Hindi & English speech recognition with text-to-speech audio guidance.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Authentic Ayush Grounding</h4>
                  <p className="text-xs text-slate-400 mt-1">RAG-grounded retrieval citing clinical protocols from verified practitioners.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Active Emergency Dispatch</h4>
                  <p className="text-xs text-slate-400 mt-1">Auto-locates nearest hospitals and alerts ambulance units via WebSockets.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-2">
              <p className="text-3xl font-black text-slate-900">100%</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Ayush Board Grounded</p>
            </div>
            <div className="p-2">
              <p className="text-3xl font-black text-teal-600">&lt;60s</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Voice Intake to Triage</p>
            </div>
            <div className="p-2">
              <p className="text-3xl font-black text-slate-900">3-Tier</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Clinical Safety Shield</p>
            </div>
            <div className="p-2">
              <p className="text-3xl font-black text-teal-600">Real-time</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-1">Ambulance WebSocket Fleet</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Clinical Safety Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            3-Tier Algorithmic Triage
          </h2>
          <p className="text-base text-slate-600">
            Ensuring patient safety through structured risk categorization, preventing OPD crowding while immediately flagging life-threatening distress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRIAGE_TIERS.map((t) => (
            <div
              key={t.tier}
              className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    {t.icon}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${t.badgeColor}`}>
                    {t.tier.split(':')[0]}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t.description}</p>
                <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-700">
                  {t.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100/70 border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Purpose-Built for Public Health OPDs
            </h2>
            <p className="text-base text-slate-600">
              Engineered to meet the requirements of the Ministry of Ayush, integrating national identifiers, real-time dispatch, and clinical accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_PILLARS.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3 className="font-bold text-base text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to evaluate or explore?</h2>
            <p className="text-sm sm:text-base text-teal-100 max-w-xl">
              Experience the voice intake, doctor consultation drawer, live ambulance command center, or admin verification hub.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/login"
              className="btn bg-white text-teal-900 hover:bg-teal-50 px-6 py-3 font-bold text-sm shadow-sm"
            >
              Sign In to Demo
            </Link>
            <Link
              to="/register"
              className="btn bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 font-bold text-sm shadow-sm"
            >
              Register New Patient
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p className="font-medium">Sudha Setu (सुधा सेतु) • SIH26047 • Ministry of Ayush, Government of India</p>
        <p className="text-slate-400 mt-1">Built with React, Express, MongoDB, Socket.IO & Web Speech API</p>
      </footer>
    </div>
  );
}
