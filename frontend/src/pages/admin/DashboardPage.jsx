import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Activity,
  Users,
  Stethoscope,
  Truck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import Spinner from '../../components/ui/Spinner.jsx';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [telemetry, setTelemetry] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    userId: '',
    specialization: '',
    medicalRegistrationNumber: '',
    yearsOfExperience: 0,
  });

  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [ambulanceForm, setAmbulanceForm] = useState({
    userId: '',
    vehicleNumber: '',
    stationName: '',
    serviceProvider: '',
  });

  const fetchTelemetry = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/telemetry');
      setTelemetry(data);
    } catch {
      toast.error('Failed to load telemetry');
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/doctors');
      setDoctors(data.doctors || []);
    } catch {
      toast.error('Failed to load doctors list');
    }
  }, []);

  const fetchAmbulances = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/ambulances');
      setAmbulances(data.ambulances || []);
    } catch {
      toast.error('Failed to load ambulances list');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load users list');
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTelemetry(), fetchDoctors(), fetchAmbulances(), fetchUsers()]);
    setLoading(false);
  }, [fetchTelemetry, fetchDoctors, fetchAmbulances, fetchUsers]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleVerifyDoctor = async (doctorId) => {
    setActionLoading(doctorId);
    try {
      await api.patch(`/admin/doctors/${doctorId}/verify`);
      toast.success('Doctor verified successfully');
      await Promise.all([fetchDoctors(), fetchTelemetry()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!doctorForm.userId || !doctorForm.specialization || !doctorForm.medicalRegistrationNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    setActionLoading('create-doctor');
    try {
      await api.post('/admin/doctors', doctorForm);
      toast.success('Doctor profile created successfully');
      setShowDoctorModal(false);
      setDoctorForm({
        userId: '',
        specialization: '',
        medicalRegistrationNumber: '',
        yearsOfExperience: 0,
      });
      await Promise.all([fetchDoctors(), fetchUsers(), fetchTelemetry()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAmbulance = async (e) => {
    e.preventDefault();
    if (!ambulanceForm.userId || !ambulanceForm.vehicleNumber || !ambulanceForm.stationName) {
      toast.error('Please fill in all required fields');
      return;
    }
    setActionLoading('create-ambulance');
    try {
      await api.post('/admin/ambulances', ambulanceForm);
      toast.success('Ambulance profile registered successfully');
      setShowAmbulanceModal(false);
      setAmbulanceForm({
        userId: '',
        vehicleNumber: '',
        stationName: '',
        serviceProvider: '',
      });
      await Promise.all([fetchAmbulances(), fetchUsers()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register ambulance');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="card shadow-sm border-slate-200/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-100">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              National Health Admin & Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Ministry of Ayush • Practitioner verification, fleet allocation, and clinical telemetry
            </p>
          </div>
        </div>

        <button
          onClick={refreshAll}
          className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Live Data
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'telemetry', label: 'Telemetry & Metrics', icon: Activity },
          { id: 'doctors', label: 'Doctor Verification Queue', icon: Stethoscope },
          { id: 'ambulances', label: 'Ambulance Units', icon: Truck },
          { id: 'users', label: 'User Governance', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'doctors' && doctors.filter((d) => !d.verified).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-bold">
                  {doctors.filter((d) => !d.verified).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'telemetry' && telemetry && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-red-500 bg-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Emergency / High Risk Cases
              </span>
              <div className="text-3xl font-extrabold text-red-600 mt-2">
                {telemetry.casesByDangerLevel?.high ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Requires immediate clinical attention</p>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-500 bg-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Medium Risk Cases
              </span>
              <div className="text-3xl font-extrabold text-amber-600 mt-2">
                {telemetry.casesByDangerLevel?.medium ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Under doctor triage / OPD queue</p>
            </div>

            <div className="card p-5 border-l-4 border-l-emerald-500 bg-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Low Risk (Self-Care)
              </span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                {telemetry.casesByDangerLevel?.low ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Dietary & lifestyle guidance</p>
            </div>

            <div className="card p-5 border-l-4 border-l-brand-600 bg-white">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Ayush KB Rules
              </span>
              <div className="text-3xl font-extrabold text-brand-700 mt-2">
                {telemetry.activeKnowledgeBaseRules ?? 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Clinical rules grounding AI triage</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 space-y-4 bg-white border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600" />
                Case Status Distribution
              </h3>
              <div className="space-y-2">
                {Object.entries(telemetry.casesByStatus || {}).map(([st, count]) => (
                  <div key={st} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-600 capitalize">
                      {st.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 space-y-4 bg-white border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-brand-600" />
                Doctor Verification Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900 text-xs">Verified Practitioners</p>
                      <p className="text-[11px] text-emerald-700">Authorised for clinical prescriptions</p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-emerald-800">
                    {telemetry.doctors?.verified ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-900 text-xs">Pending Verification</p>
                      <p className="text-[11px] text-amber-700">Awaiting credentials review</p>
                    </div>
                  </div>
                  <span className="text-xl font-extrabold text-amber-800">
                    {telemetry.doctors?.unverified ?? 0}
                  </span>
                </div>

                <div className="pt-2 text-xs text-slate-500">
                  Avg. AI Confidence Score:{' '}
                  <span className="font-bold text-slate-800">
                    {telemetry.averageConfidenceScore
                      ? `${(telemetry.averageConfidenceScore * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Registered Doctors ({doctors.length})
            </h2>
            <button
              onClick={() => setShowDoctorModal(true)}
              className="btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Doctor Profile
            </button>
          </div>

          <div className="card p-0 overflow-hidden border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Doctor</th>
                    <th className="px-5 py-3">Registration Number</th>
                    <th className="px-5 py-3">Specialization</th>
                    <th className="px-5 py-3">Experience</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{doc.userId?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400">{doc.userId?.email}</div>
                      </td>
                      <td className="px-5 py-3 font-mono font-medium text-slate-700">
                        {doc.medicalRegistrationNumber}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{doc.specialization}</td>
                      <td className="px-5 py-3">{doc.yearsOfExperience} yrs</td>
                      <td className="px-5 py-3">
                        {doc.verified ? (
                          <span className="badge-green text-[11px] gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="badge-amber text-[11px] gap-1">
                            <AlertCircle className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!doc.verified ? (
                          <button
                            onClick={() => handleVerifyDoctor(doc._id)}
                            disabled={actionLoading === doc._id}
                            className="btn-primary px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                          >
                            {actionLoading === doc._id ? 'Verifying…' : 'Approve & Verify'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Verified ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No doctors registered in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ambulances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Registered Ambulance Fleet ({ambulances.length})
            </h2>
            <button
              onClick={() => setShowAmbulanceModal(true)}
              className="btn-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Register Ambulance Unit
            </button>
          </div>

          <div className="card p-0 overflow-hidden border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Vehicle Number</th>
                    <th className="px-5 py-3">Station Base</th>
                    <th className="px-5 py-3">Service Provider</th>
                    <th className="px-5 py-3">Driver / Operator</th>
                    <th className="px-5 py-3">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ambulances.map((amb) => (
                    <tr key={amb._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">
                        {amb.vehicleNumber}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{amb.stationName}</td>
                      <td className="px-5 py-3 text-slate-600">{amb.serviceProvider || 'National Health Mission'}</td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-800">{amb.userId?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400">{amb.userId?.phone || amb.userId?.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full uppercase ${
                            amb.status === 'dispatched' || amb.status === 'busy'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {amb.status || 'available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {ambulances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No ambulance units registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              User Accounts & Role Governance ({users.length})
            </h2>
          </div>

          <div className="card p-0 overflow-hidden border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Current Role</th>
                    <th className="px-5 py-3">Registered Date</th>
                    <th className="px-5 py-3 text-right">Role Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-5 py-3">{u.phone || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200/60">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleUpdateRole(u._id, 'admin')}
                              disabled={actionLoading === u._id}
                              className="btn-secondary px-2 py-1 text-[11px] font-semibold hover:border-brand-500 hover:text-brand-700"
                            >
                              Make Admin
                            </button>
                          )}
                          {u.role !== 'support' && (
                            <button
                              onClick={() => handleUpdateRole(u._id, 'support')}
                              disabled={actionLoading === u._id}
                              className="btn-secondary px-2 py-1 text-[11px] font-semibold"
                            >
                              Make Support
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add Doctor Profile</h3>
            <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
              <div>
                <label className="label text-xs">Select User Account</label>
                <select
                  className="input text-xs py-2"
                  value={doctorForm.userId}
                  onChange={(e) => setDoctorForm({ ...doctorForm, userId: e.target.value })}
                  required
                >
                  <option value="">-- Choose User --</option>
                  {users
                    .filter((u) => u.role !== 'doctor')
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Specialization</label>
                <input
                  type="text"
                  className="input text-xs py-2"
                  placeholder="e.g. Kayachikitsa (Internal Medicine)"
                  value={doctorForm.specialization}
                  onChange={(e) =>
                    setDoctorForm({ ...doctorForm, specialization: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label text-xs">Medical Registration Number</label>
                <input
                  type="text"
                  className="input text-xs py-2"
                  placeholder="e.g. AYUSH-DOC-12345"
                  value={doctorForm.medicalRegistrationNumber}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      medicalRegistrationNumber: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="label text-xs">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  className="input text-xs py-2"
                  value={doctorForm.yearsOfExperience}
                  onChange={(e) =>
                    setDoctorForm({
                      ...doctorForm,
                      yearsOfExperience: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-doctor'}
                  className="btn-primary flex-1 py-2 text-xs font-semibold"
                >
                  {actionLoading === 'create-doctor' ? 'Creating…' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAmbulanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Register Ambulance Unit</h3>
            <form onSubmit={handleCreateAmbulance} className="space-y-3 text-xs">
              <div>
                <label className="label text-xs">Select Assigned Driver / Operator Account</label>
                <select
                  className="input text-xs py-2"
                  value={ambulanceForm.userId}
                  onChange={(e) => setAmbulanceForm({ ...ambulanceForm, userId: e.target.value })}
                  required
                >
                  <option value="">-- Choose User --</option>
                  {users
                    .filter((u) => u.role !== 'ambulance')
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label text-xs">Vehicle Registration Number</label>
                <input
                  type="text"
                  className="input text-xs py-2 font-mono"
                  placeholder="e.g. DL-01-AB-1234"
                  value={ambulanceForm.vehicleNumber}
                  onChange={(e) =>
                    setAmbulanceForm({ ...ambulanceForm, vehicleNumber: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label text-xs">Station / Base Location</label>
                <input
                  type="text"
                  className="input text-xs py-2"
                  placeholder="e.g. AIIMS Base Station, New Delhi"
                  value={ambulanceForm.stationName}
                  onChange={(e) =>
                    setAmbulanceForm({ ...ambulanceForm, stationName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="label text-xs">Service Provider / Agency</label>
                <input
                  type="text"
                  className="input text-xs py-2"
                  placeholder="e.g. National Health Mission 108"
                  value={ambulanceForm.serviceProvider}
                  onChange={(e) =>
                    setAmbulanceForm({ ...ambulanceForm, serviceProvider: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAmbulanceModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-ambulance'}
                  className="btn-primary flex-1 py-2 text-xs font-semibold"
                >
                  {actionLoading === 'create-ambulance' ? 'Registering…' : 'Register Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
