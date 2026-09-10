import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Stethoscope, Mic, ShieldCheck, Globe, ArrowRight, Heart, Leaf, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: <Mic className="w-7 h-7 text-brand-600" />,
    title: 'Voice-First',
    desc: 'Speak in Hindi or English. Our AI listens and triages automatically — no typing needed.',
  },
  {
    icon: <Leaf className="w-7 h-7 text-green-600" />,
    title: 'Ayush-Aligned',
    desc: 'Verified Ayurvedic dietary advice, prakriti assessment, and safe home remedies.',
  },
  {
    icon: <Zap className="w-7 h-7 text-amber-500" />,
    title: '3-Tier AI Triage',
    desc: 'Green self-care, Amber OPD queue, or Red SOS dispatch — all in seconds.',
  },
  {
    icon: <Globe className="w-7 h-7 text-violet-600" />,
    title: 'Multilingual',
    desc: 'Designed for rural India with support for Hindi and English input.',
  },
  {
    icon: <ShieldCheck className="w-7 h-7 text-teal-600" />,
    title: 'Doctor-Verified',
    desc: 'All advice in our knowledge base is reviewed by licensed AYUSH practitioners.',
  },
  {
    icon: <Heart className="w-7 h-7 text-red-500" />,
    title: 'Emergency Ready',
    desc: 'Instant SOS mode with nearest hospital finder and ambulance dispatch simulation.',
  },
];

export default function LandingPage() {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-5 py-2 mb-6">
            <Stethoscope className="w-4 h-4" />
            <span className="text-sm font-semibold">Team Relic · SIH26047 · Ministry of AYUSH</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-balance">
            Sudha Setu
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-brand-100 font-medium text-balance max-w-2xl mx-auto">
            Voice-enabled, multilingual pre-consultation for AYUSH OPDs.
            Triage in seconds. Care within reach.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to={['doctor', 'support', 'admin'].includes(user.role) ? '/doctor/dashboard' : '/intake'}
                className="btn bg-white text-brand-700 hover:bg-brand-50 px-8 py-4 text-lg font-bold shadow-lg"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn bg-white text-brand-700 hover:bg-brand-50 px-8 py-4 text-lg font-bold shadow-lg">
                  Start Consultation <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="btn border-2 border-white/40 hover:bg-white/10 px-8 py-4 text-lg font-semibold">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Built for Bharat
          </h2>
          <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
            Designed specifically for rural and elderly patients with low digital literacy.
            Large touch targets, simple voice UI, local language support.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-900">{f.title}</h3>
              <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-900 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold">Ready to consult?</h2>
          <p className="mt-3 text-brand-200">Create a free account and get triaged in under 60 seconds.</p>
          <div className="mt-8">
            {!user && (
              <Link to="/register" className="btn bg-white text-brand-700 hover:bg-brand-50 px-10 py-4 text-lg font-bold">
                Register Free
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm">
        <p>© 2026 Sudha Setu · Team Relic · SIH26047 · Ministry of AYUSH</p>
      </footer>
    </div>
  );
}
