import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Phone, Mail, FileText, Download, Shield, Globe, CheckCircle2, Clock, Activity, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import { setUser } from '../../store/authSlice.js';
import Spinner from '../../components/ui/Spinner.jsx';

const DANGER_BADGES = {
  high: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

export default function ProfilePage() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    abhaId: user?.abhaId || '',
    languagePreference: user?.languagePreference || 'hi',
  });

  const [saving, setSaving] = useState(false);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        abhaId: user.abhaId || '',
        languagePreference: user.languagePreference || 'hi',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/cases/my/history');
        setCases(data.cases || []);
      } catch {
        setCases([]);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', form);
      dispatch(setUser(data.user));
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = (caseId) => {
    window.open(`/api/cases/${caseId}/pdf`, '_blank');
  };

  return (
    <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)] py-8 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <User className="w-3.5 h-3.5" />
              <span>User Profile & Health Records</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Patient Account & Consultation History
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage your personal credentials, digital health identifier, and review previous clinical triage sheets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{user?.name || 'Registered User'}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user?.email}</span>
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                    Account Status: Verified ✓
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      className="input pl-9"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. 9810011001"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label !mb-0">Digital Health ID / ABHA</label>
                    <span className="text-[10px] text-slate-500">Government Record Sync</span>
                  </div>
                  <div className="relative">
                    <Shield className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="input pl-9 font-mono text-emerald-400"
                      value={form.abhaId}
                      onChange={(e) => setForm({ ...form, abhaId: e.target.value })}
                      placeholder="XX-XXXX-XXXX-XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Preferred Consultation Language</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, languagePreference: 'hi' })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        form.languagePreference === 'hi'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80'
                      }`}
                    >
                      हिन्दी (Hindi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, languagePreference: 'en' })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        form.languagePreference === 'en'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary w-full py-2.5 text-xs font-bold mt-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving Profile…' : 'Save Profile Changes'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Clinical Consultation Records</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {cases.length} Total Cases
                </span>
              </div>

              {loadingCases ? (
                <div className="py-16 flex items-center justify-center">
                  <Spinner size="md" />
                </div>
              ) : cases.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-200 text-sm">No Previous Consultations Found</p>
                  <p className="text-slate-500 mt-1">
                    When you complete a voice or text triage assessment, your verified case sheet and doctor e-prescriptions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cases.map((c) => (
                    <div
                      key={c._id}
                      className="p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 rounded-xl space-y-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              CASE #{c._id.slice(-6).toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${DANGER_BADGES[c.dangerLevel] || 'bg-slate-800 text-slate-300'}`}>
                              {c.dangerLevel} Risk
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(c.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        <button
                          onClick={() => downloadPdf(c._id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                      </div>

                      <div className="text-xs text-slate-300">
                        {c.symptoms?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {c.symptoms.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                                {s.name} {s.duration && `(${s.duration})`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="italic text-slate-400 text-[11px] line-clamp-1">
                            "{c.rawDialogue?.[0]?.message || 'General intake'}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span>Status: <strong className="text-slate-200 capitalize">{c.status?.replace(/_/g, ' ')}</strong></span>
                        <span>Language: <strong className="uppercase text-slate-200">{c.languageUsed || 'hi'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
