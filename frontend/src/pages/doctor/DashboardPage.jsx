import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, Users, Filter, AlertTriangle, Clock, CheckCircle2, Stethoscope, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import useSocket from '../../hooks/useSocket.js';
import { getSocket } from '../../lib/socket.js';
import CaseRow from '../../components/doctor/CaseRow.jsx';
import CaseDrawer from '../../components/doctor/CaseDrawer.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const DANGER_FILTER_OPTIONS = [
  { value: '', label: 'All Cases' },
  { value: 'high', label: 'High Risk (Red)' },
  { value: 'medium', label: 'Medium (Amber)' },
  { value: 'low', label: 'Low (Green)' },
];

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dangerFilter, setDangerFilter] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [newCaseBadge, setNewCaseBadge] = useState(0);

  const fetchQueue = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (dangerFilter) params.set('dangerLevel', dangerFilter);
      if (mineOnly) params.set('mine', 'true');
      const { data } = await api.get(`/doctor/queue?${params}`);
      setCases(data.cases || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setNewCaseBadge(0);
    } catch {
      toast.error('Failed to load patient queue.');
    } finally {
      setLoading(false);
    }
  }, [dangerFilter, mineOnly]);

  useEffect(() => {
    fetchQueue(1);
  }, [fetchQueue]);

  useEffect(() => {
    const sock = getSocket();
    sock.emit('doctors:join');
  }, []);

  useSocket({
    'case:new': (payload) => {
      setNewCaseBadge((n) => n + 1);
      toast.custom(
        (t) => (
          <div
            className={`bg-white border-l-4 border-red-500 shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'} transition-opacity`}
            onClick={() => { fetchQueue(1); toast.dismiss(t.id); }}
          >
            <span className="text-2xl">{payload.dangerLevel === 'high' ? '🚨' : payload.dangerLevel === 'medium' ? '⚠️' : 'ℹ️'}</span>
            <div>
              <p className="font-bold text-slate-900 text-sm">New Triage Case Received</p>
              <p className="text-xs text-slate-500 capitalize">Risk: {payload.dangerLevel} — Click to refresh</p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    },
    'case:updated': (payload) => {
      if (!payload?.caseId) return;
      setCases((currentCases) => currentCases.map((caseDoc) => (
        String(caseDoc._id) === String(payload.caseId)
          ? { ...caseDoc, status: payload.status, assignedDoctorId: payload.assignedDoctorId }
          : caseDoc
      )));
    },
  });

  const handleOpenCase = (caseDoc) => setSelectedCaseId(caseDoc._id);
  const handleCloseDrawer = () => {
    setSelectedCaseId(null);
    fetchQueue(page);
  };

  const metrics = useMemo(() => {
    const high = cases.filter((c) => c.dangerLevel === 'high').length;
    const med = cases.filter((c) => c.dangerLevel === 'medium').length;
    const low = cases.filter((c) => c.dangerLevel === 'low').length;
    return { high, med, low, total: cases.length };
  }, [cases]);

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return cases;
    const q = searchQuery.toLowerCase();
    return cases.filter((c) => {
      const name = c.patient?.name?.toLowerCase() || '';
      const phone = c.patient?.phone?.toLowerCase() || '';
      const symptoms = (c.symptoms || []).map((s) => s.name).join(' ').toLowerCase();
      return name.includes(q) || phone.includes(q) || symptoms.includes(q);
    });
  }, [cases, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Ayush OPD Consultation Queue
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Triage triage stream · Active doctor: <span className="font-semibold text-slate-700">{user?.name}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {newCaseBadge > 0 && (
            <span className="badge-red text-xs font-bold animate-pulse px-3 py-1">
              +{newCaseBadge} New Incoming
            </span>
          )}
          <button
            onClick={() => fetchQueue(page)}
            disabled={loading}
            className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border-slate-200/80 bg-white shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Queue Total</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </div>

        <div className="card p-4 border-red-200 bg-red-50/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">High Risk</p>
            <p className="text-2xl font-bold text-red-900">{metrics.high}</p>
          </div>
        </div>

        <div className="card p-4 border-amber-200 bg-amber-50/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Medium Risk</p>
            <p className="text-2xl font-bold text-amber-900">{metrics.med}</p>
          </div>
        </div>

        <div className="card p-4 border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Low Risk</p>
            <p className="text-2xl font-bold text-emerald-900">{metrics.low}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          {DANGER_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setDangerFilter(opt.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                dangerFilter === opt.value
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {['doctor', 'admin'].includes(user?.role) && (
            <button
              onClick={() => setMineOnly((m) => !m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                mineOnly
                  ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              }`}
            >
              Assigned to Me
            </button>
          )}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient or symptoms…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input text-xs py-2 pl-9 pr-3 w-full"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="font-semibold text-base text-slate-700">No matching cases in queue</p>
            <p className="text-xs text-slate-400 mt-1">Live patient intakes will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Symptoms</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Triage Tier</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Case Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Intake Time</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c, i) => (
                  <CaseRow key={c._id} caseDoc={c} onOpen={handleOpenCase} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fetchQueue(page - 1)}
            disabled={page <= 1 || loading}
            className="btn-secondary px-3 py-1.5 text-xs font-semibold"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchQueue(page + 1)}
            disabled={page >= totalPages || loading}
            className="btn-secondary px-3 py-1.5 text-xs font-semibold"
          >
            Next →
          </button>
        </div>
      )}

      {selectedCaseId && (
        <CaseDrawer caseId={selectedCaseId} onClose={handleCloseDrawer} />
      )}
    </div>
  );
}
