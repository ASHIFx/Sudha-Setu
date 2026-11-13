import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Truck,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  ShieldAlert,
  Navigation,
} from 'lucide-react';
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
    } catch (err) {
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
    'ambulance:new-dispatch': (payload) => {
      toast.error('🚨 New Emergency Dispatch Assigned!', { duration: 6000 });
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
      toast.success(`Dispatch marked as ${newStatus}`);
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
          <span className="badge-amber font-semibold text-xs">
            Dispatched (Pending Response)
          </span>
        );
      case 'accepted':
        return (
          <span className="badge-blue font-semibold text-xs bg-sky-100 text-sky-800 border-sky-200">
            En Route to Location
          </span>
        );
      case 'completed':
        return (
          <span className="badge-green font-semibold text-xs">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge font-semibold text-xs bg-slate-100 text-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="badge font-semibold text-xs bg-slate-100 text-slate-700">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="card shadow-sm border-slate-200/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-200">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Emergency Ambulance Dispatch Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {profile ? (
                <>
                  Unit: <span className="font-semibold text-slate-800">{profile.vehicleNumber}</span> · Station: <span className="font-semibold text-slate-800">{profile.stationName}</span> · Status: <span className="font-semibold uppercase text-emerald-700">{profile.status || 'available'}</span>
                </>
              ) : (
                `Logged in as: ${user?.name} (${user?.role})`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDispatches}
            className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Runs
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            Active Emergency Dispatches ({activeDispatches.length})
          </h2>
        </div>

        {activeDispatches.length === 0 ? (
          <div className="card border-slate-200 p-12 text-center text-slate-500 bg-white">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-800">No active emergency dispatches</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your unit is on standby. High-risk triage dispatches will stream here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeDispatches.map((dispatch) => (
              <div
                key={dispatch._id}
                className="card border-red-200 shadow-md p-6 space-y-4 relative overflow-hidden bg-white"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600" />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge-red font-bold text-[11px] uppercase tracking-wider inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Critical Red Alert
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      Dispatch #{dispatch._id.slice(-6).toUpperCase()}
                    </h3>
                  </div>
                  {getStatusBadge(dispatch.status)}
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dispatched: <strong className="text-slate-800">{new Date(dispatch.createdAt).toLocaleTimeString()}</strong></span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Patient GPS:</span>{' '}
                      {dispatch.patientLocation?.lat != null && dispatch.patientLocation?.lng != null ? (
                        <span>
                          {dispatch.patientLocation.lat.toFixed(4)}, {dispatch.patientLocation.lng.toFixed(4)}{' '}
                          {dispatch.patientLocation.address && `(${dispatch.patientLocation.address})`}
                        </span>
                      ) : (
                        <span>Real-time location stream</span>
                      )}
                    </div>
                  </div>

                  {dispatch.hospitalId && (
                    <div className="flex items-start gap-2">
                      <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Target Hospital:</span>{' '}
                        {dispatch.hospitalId.name || 'AIIMS Emergency Center'}{' '}
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
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{dispatch.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {dispatch.status === 'dispatched' && (
                    <button
                      onClick={() => handleUpdateStatus(dispatch._id, 'accepted')}
                      disabled={updatingId === dispatch._id}
                      className="btn-primary flex-1 py-2 text-xs font-semibold"
                    >
                      {updatingId === dispatch._id ? 'Updating…' : 'Accept Dispatch (En Route)'}
                    </button>
                  )}

                  {dispatch.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(dispatch._id, 'completed')}
                      disabled={updatingId === dispatch._id}
                      className="btn-primary flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                    >
                      {updatingId === dispatch._id ? 'Updating…' : 'Mark Completed (At Hospital)'}
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(dispatch._id, 'cancelled')}
                    disabled={updatingId === dispatch._id}
                    className="btn-secondary px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600"
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
        <div className="space-y-3 pt-4">
          <h2 className="text-base font-bold text-slate-800">
            Completed Dispatches ({pastDispatches.length})
          </h2>
          <div className="card p-0 overflow-hidden border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Dispatch Ref</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned Hospital</th>
                    <th className="px-5 py-3">Dispatch Time</th>
                    <th className="px-5 py-3">Resolution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastDispatches.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-medium text-slate-900">
                        #{d._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-5 py-3">{getStatusBadge(d.status)}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {d.hospitalId?.name || 'Emergency Center'}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
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
