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
      // Admin might not have an ambulance profile
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

  // Socket event listeners
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

  // Join ambulance room on connect
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
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Dispatched (Pending Acceptance)
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            En Route (Accepted)
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
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
      {/* Header Profile Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Ambulance Dispatch Command Center
            </h1>
            <p className="text-sm text-slate-500">
              {profile ? (
                <>
                  Unit: <span className="font-semibold text-slate-700">{profile.vehicleNumber}</span> | Station: <span className="font-semibold text-slate-700">{profile.stationName}</span> | Status: <span className="font-semibold uppercase text-emerald-600">{profile.status || 'available'}</span>
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
            className="btn-ghost px-4 py-2 text-sm flex items-center gap-2 border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Active Emergencies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Active Emergency Dispatches ({activeDispatches.length})
          </h2>
        </div>

        {activeDispatches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">No pending emergency dispatches</p>
            <p className="text-sm text-slate-400 mt-1">
              Your unit is on standby. Incoming SOS alerts will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeDispatches.map((dispatch) => (
              <div
                key={dispatch._id}
                className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6 space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500" />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5" /> High Risk Case
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      Dispatch #{dispatch._id.slice(-6).toUpperCase()}
                    </h3>
                  </div>
                  {getStatusBadge(dispatch.status)}
                </div>

                <div className="space-y-2 text-sm text-slate-600 border-t border-b border-slate-100 py-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Dispatched: {new Date(dispatch.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">Patient Location:</span>{' '}
                      {dispatch.patientLocation?.lat != null && dispatch.patientLocation?.lng != null ? (
                        <span>
                          {dispatch.patientLocation.lat.toFixed(4)},{' '}
                          {dispatch.patientLocation.lng.toFixed(4)}{' '}
                          {dispatch.patientLocation.address && `(${dispatch.patientLocation.address})`}
                        </span>
                      ) : (
                        <span>Location shared via mobile device</span>
                      )}
                    </div>
                  </div>

                  {dispatch.hospitalId && (
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Target Hospital:</span>{' '}
                        {dispatch.hospitalId.name || 'Emergency Center'}{' '}
                        {dispatch.hospitalId.phone && (
                          <span className="text-slate-500 text-xs">
                            (<Phone className="inline w-3 h-3 mr-0.5" />
                            {dispatch.hospitalId.phone})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {dispatch.notes && (
                    <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">
                      &ldquo;{dispatch.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Dispatch Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {dispatch.status === 'dispatched' && (
                    <button
                      onClick={() => handleUpdateStatus(dispatch._id, 'accepted')}
                      disabled={updatingId === dispatch._id}
                      className="btn-primary flex-1 py-2.5 text-sm bg-blue-600 hover:bg-blue-700"
                    >
                      {updatingId === dispatch._id ? 'Updating…' : 'Accept Dispatch'}
                    </button>
                  )}

                  {dispatch.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(dispatch._id, 'completed')}
                      disabled={updatingId === dispatch._id}
                      className="btn-primary flex-1 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-700"
                    >
                      {updatingId === dispatch._id ? 'Updating…' : 'Mark Completed (At Hospital)'}
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(dispatch._id, 'cancelled')}
                    disabled={updatingId === dispatch._id}
                    className="btn-ghost px-4 py-2.5 text-sm text-slate-500 hover:text-red-600 border border-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed / Past Dispatches */}
      {pastDispatches.length > 0 && (
        <div className="space-y-4 pt-6">
          <h2 className="text-lg font-bold text-slate-700">
            Past Runs ({pastDispatches.length})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Dispatch ID</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Hospital</th>
                    <th className="px-6 py-3">Dispatched At</th>
                    <th className="px-6 py-3">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastDispatches.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        #{d._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                      <td className="px-6 py-4">
                        {d.hospitalId?.name || 'Emergency Center'}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
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
