import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, Users, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import useSocket from '../../hooks/useSocket.js';
import { getSocket } from '../../lib/socket.js';
import CaseRow from '../../components/doctor/CaseRow.jsx';
import CaseDrawer from '../../components/doctor/CaseDrawer.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const DANGER_FILTER_OPTIONS = [
  { value: '', label: 'All Risk Levels' },
  { value: 'high', label: '🔴 High Risk' },
  { value: 'medium', label: '🟡 Medium Risk' },
  { value: 'low', label: '🟢 Low Risk' },
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
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [newCaseBadge, setNewCaseBadge] = useState(0);

  const fetchQueue = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (dangerFilter) params.set('dangerLevel', dangerFilter);
      if (mineOnly) params.set('mine', 'true');
      const { data } = await api.get(`/doctor/queue?${params}`);
      setCases(data.cases);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
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
            className={`bg-white border-l-4 border-red-500 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer ${t.visible ? 'opacity-100' : 'opacity-0'} transition-opacity`}
            onClick={() => { fetchQueue(1); toast.dismiss(t.id); }}
          >
            <span className="text-2xl">{payload.dangerLevel === 'high' ? '🚨' : payload.dangerLevel === 'medium' ? '⚠️' : 'ℹ️'}</span>
            <div>
              <p className="font-bold text-slate-900 text-sm">New Case Arrived</p>
              <p className="text-xs text-slate-500 capitalize">Risk: {payload.dangerLevel} — Tap to refresh</p>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    },
    'case:updated': () => {
      fetchQueue(page);
    },
  });

  const handleOpenCase = (caseDoc) => setSelectedCaseId(caseDoc._id);
  const handleCloseDrawer = () => {
    setSelectedCaseId(null);
    fetchQueue(page);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            OPD Queue
          </h1>
          <p className="text-slate-500 mt-1">
            {total} case{total !== 1 ? 's' : ''} waiting ·{' '}
            <span className="capitalize text-slate-600 font-medium">{user?.role}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {newCaseBadge > 0 && (
            <span className="badge-red text-sm animate-pulse">
              {newCaseBadge} new
            </span>
          )}
          <button
            onClick={() => fetchQueue(1)}
            disabled={loading}
            className="btn-ghost px-3 py-2 text-sm flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400" />
        {DANGER_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setDangerFilter(opt.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              dangerFilter === opt.value
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {['doctor', 'admin'].includes(user?.role) && (
          <button
            onClick={() => setMineOnly((m) => !m)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              mineOnly
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Mine Only
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-lg">No cases in the queue</p>
            <p className="text-sm mt-1">New intake submissions will appear here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Symptoms</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Time</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c, i) => (
                  <CaseRow key={c._id} caseDoc={c} onOpen={handleOpenCase} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchQueue(page - 1)}
            disabled={page <= 1 || loading}
            className="btn-ghost px-4 py-2"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => fetchQueue(page + 1)}
            disabled={page >= totalPages || loading}
            className="btn-ghost px-4 py-2"
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
