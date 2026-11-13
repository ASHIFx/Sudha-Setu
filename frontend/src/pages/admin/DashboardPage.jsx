import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, ShieldCheck, Activity, Users, Truck } from 'lucide-react';
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
      toast.success('Doctor credentials verified.');
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
      toast.success(`Role updated to ${newRole}`);
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
      toast.success('Doctor credentials profile registered.');
      setShowDoctorModal(false);
      setDoctorForm({
        userId: '',
        specialization: '',
        medicalRegistrationNumber: '',
        yearsOfExperience: 0,
      });
      await Promise.all([fetchDoctors(), fetchUsers(), fetchTelemetry()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor profile');
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
      toast.success('Ambulance vehicle registered.');
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
      <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)] py-6 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Governance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Administration & Clinical Telemetry Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Clinical credential verification, ambulance fleet registry, user role governance, and epidemiological triage metrics.
            </p>
          </div>

          <button
            onClick={refreshAll}
            className="btn-secondary py-1.5 px-3 text-xs font-semibold self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
          {[
            { id: 'telemetry', label: 'Platform Telemetry' },
            { id: 'doctors', label: `Doctor Credentialing (${doctors.filter((d) => !d.verified).length} Pending)` },
            { id: 'ambulances', label: `Ambulance Fleet (${ambulances.length})` },
            { id: 'users', label: `User Roles (${users.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700/80 hover:bg-slate-700/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'telemetry' && telemetry && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs divide-y lg:divide-y-0 lg:divide-x divide-slate-800 shadow-xl backdrop-blur-xl">
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Tier 3 High Risk</p>
                <p className="text-2xl font-black text-rose-400 mt-0.5">{telemetry.casesByDangerLevel?.high ?? 0}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Emergency dispatched</p>
              </div>
              <div className="pt-2 lg:pt-0 lg:pl-4">
                <p className="text-slate-400 font-medium uppercase text-[10px]">Tier 2 Medium Risk</p>
                <p className="text-2xl font-black text-amber-400 mt-0.5">{telemetry.casesByDangerLevel?.medium ?? 0}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Queued in OPD</p>
              </div>
              <div className="pt-2 lg:pt-0 lg:pl-4">
                <p className="text-slate-400 font-medium uppercase text-[10px]">Tier 1 Low Risk</p>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">{telemetry.casesByDangerLevel?.low ?? 0}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Self-care Ahara regimen</p>
              </div>
              <div className="pt-2 lg:pt-0 lg:pl-4">
                <p className="text-slate-400 font-medium uppercase text-[10px]">Active KB Rules</p>
                <p className="text-2xl font-black text-white mt-0.5">{telemetry.activeKnowledgeBaseRules ?? 0}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Grounded clinical rules</p>
              </div>
              <div className="pt-2 lg:pt-0 lg:pl-4">
                <p className="text-slate-400 font-medium uppercase text-[10px]">Mean AI Grounding</p>
                <p className="text-2xl font-black text-teal-300 mt-0.5">
                  {telemetry.averageConfidenceScore
                    ? `${(telemetry.averageConfidenceScore * 100).toFixed(1)}%`
                    : 'N/A'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Clinical confidence score</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl backdrop-blur-xl">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Case Workflow Status Breakdown</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(telemetry.casesByStatus || {}).map(([st, count]) => (
                    <div key={st} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                      <span className="font-medium text-slate-300 capitalize">{st.replace(/_/g, ' ')}</span>
                      <span className="font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-emerald-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl backdrop-blur-xl">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Practitioner Verification Status</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-300">Verified Medical Officers</p>
                      <p className="text-[11px] text-emerald-400/80">Licensed to sign digital e-prescriptions</p>
                    </div>
                    <span className="text-2xl font-black text-emerald-300">{telemetry.doctors?.verified ?? 0}</span>
                  </div>
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-amber-300">Pending Credential Verification</p>
                      <p className="text-[11px] text-amber-400/80">Awaiting medical council registration review</p>
                    </div>
                    <span className="text-2xl font-black text-amber-300">{telemetry.doctors?.unverified ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registered Medical Officers ({doctors.length})
              </h2>
              <button
                onClick={() => setShowDoctorModal(true)}
                className="btn-primary py-1.5 px-3 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Doctor Profile</span>
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 font-bold uppercase text-[11px] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Doctor Name</th>
                      <th className="px-4 py-3">Medical Reg. Number</th>
                      <th className="px-4 py-3">Specialization</th>
                      <th className="px-4 py-3">Experience</th>
                      <th className="px-4 py-3">Verification</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {doctors.map((doc) => (
                      <tr key={doc._id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{doc.userId?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-slate-400">{doc.userId?.email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                          {doc.medicalRegistrationNumber}
                        </td>
                        <td className="px-4 py-3">{doc.specialization}</td>
                        <td className="px-4 py-3">{doc.yearsOfExperience} yrs</td>
                        <td className="px-4 py-3">
                          {doc.verified ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Verified
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!doc.verified ? (
                            <button
                              onClick={() => handleVerifyDoctor(doc._id)}
                              disabled={actionLoading === doc._id}
                              className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                            >
                              {actionLoading === doc._id ? 'Verifying…' : 'Approve & Verify'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-semibold">Approved ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {doctors.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registered Ambulance Fleet Units ({ambulances.length})
              </h2>
              <button
                onClick={() => setShowAmbulanceModal(true)}
                className="btn-primary py-1.5 px-3 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Unit</span>
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 font-bold uppercase text-[11px] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Vehicle Number</th>
                      <th className="px-4 py-3">Station Base</th>
                      <th className="px-4 py-3">Fleet Provider</th>
                      <th className="px-4 py-3">Assigned Operator</th>
                      <th className="px-4 py-3">Unit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {ambulances.map((amb) => (
                      <tr key={amb._id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white">
                          {amb.vehicleNumber}
                        </td>
                        <td className="px-4 py-3">{amb.stationName}</td>
                        <td className="px-4 py-3 text-slate-300">{amb.serviceProvider || 'National Emergency Service 108'}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{amb.userId?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-slate-400">{amb.userId?.phone || amb.userId?.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              amb.status === 'dispatched' || amb.status === 'busy'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {amb.status || 'available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {ambulances.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                User Role Governance ({users.length})
              </h2>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 border-b border-slate-800 font-bold uppercase text-[11px] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Active Role</th>
                      <th className="px-4 py-3">Registered Date</th>
                      <th className="px-4 py-3 text-right">Role Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">{u.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleUpdateRole(u._id, 'admin')}
                                disabled={actionLoading === u._id}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-slate-700 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                              >
                                Make Admin
                              </button>
                            )}
                            {u.role !== 'support' && (
                              <button
                                onClick={() => handleUpdateRole(u._id, 'support')}
                                disabled={actionLoading === u._id}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-slate-700 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
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
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-800 text-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Register Doctor Profile</h3>
              <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
                <div>
                  <label className="label">Select User Account</label>
                  <select
                    className="input text-xs py-2"
                    value={doctorForm.userId}
                    onChange={(e) => setDoctorForm({ ...doctorForm, userId: e.target.value })}
                    required
                  >
                    <option value="" className="bg-slate-900 text-white">-- Choose User --</option>
                    {users
                      .filter((u) => u.role !== 'doctor')
                      .map((u) => (
                        <option key={u._id} value={u._id} className="bg-slate-900 text-white">
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="label">Specialization</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. General Physician / Internal Medicine"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Medical Registration Number</label>
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="e.g. REG-DEL-2018-0421"
                    value={doctorForm.medicalRegistrationNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, medicalRegistrationNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Years of Experience</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={doctorForm.yearsOfExperience}
                    onChange={(e) => setDoctorForm({ ...doctorForm, yearsOfExperience: Number(e.target.value) })}
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
                    className="btn-primary flex-1 py-2 text-xs font-bold"
                  >
                    {actionLoading === 'create-doctor' ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAmbulanceModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-800 text-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Register Ambulance Fleet Unit</h3>
              <form onSubmit={handleCreateAmbulance} className="space-y-3 text-xs">
                <div>
                  <label className="label">Assigned Driver / Operator Account</label>
                  <select
                    className="input text-xs py-2"
                    value={ambulanceForm.userId}
                    onChange={(e) => setAmbulanceForm({ ...ambulanceForm, userId: e.target.value })}
                    required
                  >
                    <option value="" className="bg-slate-900 text-white">-- Choose User --</option>
                    {users
                      .filter((u) => u.role !== 'ambulance')
                      .map((u) => (
                        <option key={u._id} value={u._id} className="bg-slate-900 text-white">
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="label">Vehicle Registration Number</label>
                  <input
                    type="text"
                    className="input font-mono"
                    placeholder="e.g. DL-01-AY-1081"
                    value={ambulanceForm.vehicleNumber}
                    onChange={(e) => setAmbulanceForm({ ...ambulanceForm, vehicleNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Station Base Location</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Central Emergency Base"
                    value={ambulanceForm.stationName}
                    onChange={(e) => setAmbulanceForm({ ...ambulanceForm, stationName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Service Agency / Provider</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. National Emergency Health Service 108"
                    value={ambulanceForm.serviceProvider}
                    onChange={(e) => setAmbulanceForm({ ...ambulanceForm, serviceProvider: e.target.value })}
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
                    className="btn-primary flex-1 py-2 text-xs font-bold"
                  >
                    {actionLoading === 'create-ambulance' ? 'Registering…' : 'Register Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
