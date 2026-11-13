import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RefreshCw, MapPin, Building2, Phone } from 'lucide-react';
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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
            Pending Unit Acceptance
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
            En Route to Location
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
            Completed / Transferred
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeDispatches = dispatches.filter((d) => ['dispatched', 'accepted'].includes(d.status));
  const pastDispatches = dispatches.filter((d) => ['completed', 'cancelled'].includes(d.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white border border-slate-200 rounded p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            National Health Mission 108 • EMS Fleet Console
          </p>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Emergency Ambulance Dispatch Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {profile ? (
              <>
                Vehicle: <strong className="font-mono text-slate-800">{profile.vehicleNumber}</strong> • Station: <strong className="text-slate-800">{profile.stationName}</strong> • State: <strong className="uppercase text-emerald-700">{profile.status || 'available'}</strong>
              </>
            ) : (
              `Operator: ${user?.name} (${user?.role})`
            )}
          </p>
        </div>

        <button
          onClick={fetchDispatches}
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Fleet Runs</span>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Active Emergency Dispatches ({activeDispatches.length})
          </h2>
        </div>

        {activeDispatches.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-500 text-xs">
            <p className="font-semibold text-slate-800 text-sm">No Active Emergency Dispatches</p>
            <p className="text-slate-400 mt-1">
              Unit is currently on standby. High-risk red triage alerts will stream here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDispatches.map((dispatch) => (
              <div
                key={dispatch._id}
                className="bg-white border-2 border-red-300 rounded p-5 space-y-3 relative"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-900">
                      Tier 3 Red Alert
                    </span>
                    <h3 className="text-sm font-mono font-bold text-slate-900 mt-1">
                      RUN #{dispatch._id.slice(-6).toUpperCase()}
                    </h3>
                  </div>
                  {getStatusBadge(dispatch.status)}
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Patient GPS Coordinates:</span>{' '}
                      {dispatch.patientLocation?.lat != null && dispatch.patientLocation?.lng != null ? (
                        <span className="font-mono">
                          {dispatch.patientLocation.lat.toFixed(4)}, {dispatch.patientLocation.lng.toFixed(4)}{' '}
                          {dispatch.patientLocation.address && `(${dispatch.patientLocation.address})`}
                        </span>
                      ) : (
                        <span>Location shared via mobile device</span>
                      )}
                    </div>
                  </div>

                  {dispatch.hospitalId && (
                    <div className="flex items-start gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Target Hospital:</span>{' '}
                        {dispatch.hospitalId.name || 'Emergency Facility'}{' '}
                        {dispatch.hospitalId.phone && (
                          <span className="text-slate-500 text-[11px]">
                            (<Phone className="inline w-3 h-3 mr-0.5" />
                            {dispatch.hospitalId.phone})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {dispatch.notes && (
                    <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 italic">
                      "{dispatch.notes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {dispatch.status === 'dispatched' && (
                    <button
                      onClick={() => handleUpdateStatus(dispatch._id, 'accepted')}
                      disabled={updatingId === dispatch._id}
                      className="flex-1 py-1.5 px-3 bg-sky-800 hover:bg-sky-900 text-white rounded text-xs font-bold transition-colors"
                    >
                      {updatingId === dispatch._id ? 'Updating…' : 'Accept Run (En Route)'}
                    </button>
                  )}

                  {dispatch.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(dispatch._id, 'completed')}
                      disabled={updatingId === dispatch._id}
                      className="flex-1 py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-bold transition-colors"
                    >
                      {updatingId === dispatch._id ? 'Updating…' : 'Mark Completed (At Hospital)'}
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(dispatch._id, 'cancelled')}
                    disabled={updatingId === dispatch._id}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resolved Fleet Runs ({pastDispatches.length})
          </h2>
          <div className="bg-white border border-slate-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Dispatch Ref</th>
                    <th className="px-4 py-2.5">Outcome</th>
                    <th className="px-4 py-2.5">Receiving Facility</th>
                    <th className="px-4 py-2.5">Dispatch Timestamp</th>
                    <th className="px-4 py-2.5">Resolution Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastDispatches.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                        #{d._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-2.5">{getStatusBadge(d.status)}</td>
                      <td className="px-4 py-2.5 font-medium">
                        {d.hospitalId?.name || 'Emergency Center'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-[11px]">
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
  );
}
