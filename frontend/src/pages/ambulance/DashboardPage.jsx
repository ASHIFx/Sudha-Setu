import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, MapPin, Building2, Phone, Truck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import useSocket from '../../hooks/useSocket.js';
import Spinner from '../../components/ui/Spinner.jsx';

export default function AmbulanceDashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const [profile, setProfile] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/ambulance/me/profile');
      setProfile(data.ambulance);
    } catch (err) {
      if (user?.role !== 'admin') {
        console.warn('[ambulance] Could not fetch ambulance profile:', err.message);
      }
    }
  }, [user?.role]);

  const fetchDispatches = useCallback(async () => {
    try {
      const { data } = await api.get('/ambulance/dispatches');
      setDispatches(data.dispatches || []);
    } catch {
      toast.error('Failed to load dispatches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchDispatches();
  }, [fetchProfile, fetchDispatches]);

  const socketRef = useSocket({
    'ambulance:new-dispatch': () => {
      toast.error('New Emergency Run Dispatched to Fleet', { duration: 6000 });
      fetchDispatches();
    },
    'ambulance:status-update': (payload) => {
      setDispatches((prev) =>
        prev.map((d) =>
          d._id === payload.dispatchId
            ? { ...d, status: payload.status, updatedAt: payload.updatedAt }
            : d
        )
      );
    },
  });

  useEffect(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit('ambulance:join');
    }
  }, [socketRef]);

  const handleUpdateStatus = async (dispatchId, newStatus) => {
    setUpdatingId(dispatchId);
    try {
      const { data } = await api.patch(`/ambulance/dispatches/${dispatchId}/status`, {
        status: newStatus,
      });
      setDispatches((prev) =>
        prev.map((d) => (d._id === dispatchId ? { ...d, status: data.dispatch.status } : d))
      );
      toast.success(`Dispatch status updated to ${newStatus}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'dispatched':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Pending Acceptance
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/30">
            En Route to Location
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Completed / Transferred
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeDispatches = dispatches.filter((d) => ['dispatched', 'accepted'].includes(d.status));
  const pastDispatches = dispatches.filter((d) => ['completed', 'cancelled'].includes(d.status));

  return (
    <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)] py-6 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-1">
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet Operations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Emergency Ambulance Command Console
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {profile ? (
                <>
                  Vehicle: <strong className="font-mono text-emerald-400">{profile.vehicleNumber}</strong> • Station: <strong className="text-slate-200">{profile.stationName}</strong> • State: <strong className="uppercase text-emerald-400">{profile.status || 'available'}</strong>
                </>
              ) : (
                `Operator: ${user?.name} (${user?.role})`
              )}
            </p>
          </div>

          <button
            onClick={fetchDispatches}
            className="btn-secondary py-1.5 px-3 text-xs font-semibold self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Fleet Runs</span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Active Emergency Dispatches ({activeDispatches.length})</span>
            </h2>
          </div>

          {activeDispatches.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs backdrop-blur-md">
              <p className="font-semibold text-slate-200 text-sm">No Active Emergency Dispatches</p>
              <p className="text-slate-500 mt-1">
                Unit is currently on standby. High-risk red triage alerts will stream here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDispatches.map((dispatch) => (
                <div
                  key={dispatch._id}
                  className="bg-slate-900/90 border-2 border-rose-500/50 hover:border-rose-500/80 rounded-2xl p-5 space-y-3.5 relative shadow-2xl backdrop-blur-xl transition-colors"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Tier 3 Red Alert
                      </span>
                      <h3 className="text-sm font-mono font-bold text-white mt-1">
                        RUN #{dispatch._id.slice(-6).toUpperCase()}
                      </h3>
                    </div>
                    {getStatusBadge(dispatch.status)}
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Patient Location:</span>{' '}
                        {dispatch.patientLocation?.lat != null && dispatch.patientLocation?.lng != null ? (
                          <span className="font-mono text-emerald-400">
                            {dispatch.patientLocation.lat.toFixed(4)}, {dispatch.patientLocation.lng.toFixed(4)}{' '}
                            {dispatch.patientLocation.address && `(${dispatch.patientLocation.address})`}
                          </span>
                        ) : (
                          <span>Location shared via mobile device</span>
                        )}
                      </div>
                    </div>

                    {dispatch.hospitalId && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white">Target Facility:</span>{' '}
                          <span className="text-slate-200">{dispatch.hospitalId.name || 'Emergency Facility'}</span>{' '}
                          {dispatch.hospitalId.phone && (
                            <span className="text-slate-400 text-[11px]">
                              (<Phone className="inline w-3 h-3 mr-0.5 text-rose-400" />
                              {dispatch.hospitalId.phone})
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {dispatch.notes && (
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 italic">
                        "{dispatch.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    {dispatch.status === 'dispatched' && (
                      <button
                        onClick={() => handleUpdateStatus(dispatch._id, 'accepted')}
                        disabled={updatingId === dispatch._id}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-sky-600/30 cursor-pointer"
                      >
                        {updatingId === dispatch._id ? 'Updating…' : 'Accept Run (En Route)'}
                      </button>
                    )}

                    {dispatch.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(dispatch._id, 'completed')}
                        disabled={updatingId === dispatch._id}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        {updatingId === dispatch._id ? 'Updating…' : 'Mark Completed (At Hospital)'}
                      </button>
                    )}

                    <button
                      onClick={() => handleUpdateStatus(dispatch._id, 'cancelled')}
                      disabled={updatingId === dispatch._id}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pastDispatches.length > 0 && (
          <div className="space-y-3 pt-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Resolved Fleet Runs ({pastDispatches.length})
            </h2>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 font-bold uppercase text-[11px] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Dispatch Ref</th>
                      <th className="px-4 py-3">Outcome</th>
                      <th className="px-4 py-3">Receiving Facility</th>
                      <th className="px-4 py-3">Dispatch Timestamp</th>
                      <th className="px-4 py-3">Resolution Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {pastDispatches.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          #{d._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(d.status)}</td>
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {d.hospitalId?.name || 'Emergency Center'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {new Date(d.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {new Date(d.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
