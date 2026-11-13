import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, Search, Stethoscope } from 'lucide-react';
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
  { value: 'medium', label: 'Medium Risk (Amber)' },
  { value: 'low', label: 'Low Risk (Green)' },
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
      toast(
        `New case arrived (${payload.dangerLevel?.toUpperCase() || 'TRIAGE'})`,
        { icon: '📋' }
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
    return { high, med, low };
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
    <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)] py-6 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              OPD Consultation Queue
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Clinician: <span className="font-semibold text-slate-200">{user?.name}</span> • Facility: <span className="text-slate-300">Central Medical OPD</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {newCaseBadge > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                +{newCaseBadge} New Intake
              </span>
            )}
            <button
              onClick={() => fetchQueue(page)}
              disabled={loading}
              className="btn-secondary py-1.5 px-3 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-800 shadow-xl backdrop-blur-xl">
          <div className="pr-2">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Total Waiting</p>
            <p className="text-2xl font-black text-white mt-0.5">{total}</p>
          </div>
          <div className="pt-2 sm:pt-0 sm:pl-4">
            <p className="text-rose-400 font-semibold uppercase tracking-wider text-[11px]">High Risk</p>
            <p className="text-2xl font-black text-rose-400 mt-0.5">{metrics.high}</p>
          </div>
          <div className="pt-2 sm:pt-0 sm:pl-4">
            <p className="text-amber-400 font-semibold uppercase tracking-wider text-[11px]">Medium Risk</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{metrics.med}</p>
          </div>
          <div className="pt-2 sm:pt-0 sm:pl-4">
            <p className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">Low Risk</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{metrics.low}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            {DANGER_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setDangerFilter(opt.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  dangerFilter === opt.value
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {['doctor', 'admin'].includes(user?.role) && (
              <button
                onClick={() => setMineOnly((m) => !m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  mineOnly
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                }`}
              >
                Assigned to Me
              </button>
            )}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient, symptoms…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input text-xs py-1.5 pl-8 pr-3"
            />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <p className="font-semibold text-slate-200 text-sm">No cases match the selected filter</p>
              <p className="mt-1 text-slate-500">Incoming patient intakes will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5">Patient</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">Symptoms</th>
                    <th className="px-4 py-3.5">Triage Risk</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">Status</th>
                    <th className="px-4 py-3.5 hidden lg:table-cell">Intake Timestamp</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredCases.map((c, i) => (
                    <CaseRow key={c._id} caseDoc={c} onOpen={handleOpenCase} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-1 text-xs">
            <button
              onClick={() => fetchQueue(page - 1)}
              disabled={page <= 1 || loading}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Previous
            </button>
            <span className="text-slate-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchQueue(page + 1)}
              disabled={page >= totalPages || loading}
              className="btn-secondary py-1 px-3 text-xs"
            >
              Next
            </button>
          </div>
        )}

        {selectedCaseId && (
          <CaseDrawer caseId={selectedCaseId} onClose={handleCloseDrawer} />
        )}
      </div>
    </div>
  );
}
