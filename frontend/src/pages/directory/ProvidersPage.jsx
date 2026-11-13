import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Truck, Search, Phone, ShieldCheck, MapPin, Building2, Clock, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import Spinner from '../../components/ui/Spinner.jsx';

export default function ProvidersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/directory/all');
      setDoctors(data.doctors || []);
      setAmbulances(data.ambulances || []);
    } catch {
      toast.error('Failed to load healthcare providers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.registrationNumber.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  const filteredAmbulances = useMemo(() => {
    if (!search.trim()) return ambulances;
    const q = search.toLowerCase();
    return ambulances.filter(
      (a) =>
        a.vehicleNumber.toLowerCase().includes(q) ||
        a.stationName.toLowerCase().includes(q) ||
        a.serviceProvider.toLowerCase().includes(q)
    );
  }, [ambulances, search]);

  return (
    <div className="bg-[#0B0F19] min-h-[calc(100vh-4rem)] py-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border-2 border-rose-500/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Emergency Medical Hotlines & Dispatch
              </h2>
              <p className="text-xs text-rose-200/90 mt-0.5">
                For immediate life-threatening distress, cardiac arrest, or severe accidents, dial 112 directly. On-duty ambulance units stream GPS runs in real time.
              </p>
            </div>
          </div>

          <a
            href="tel:112"
            className="btn-danger py-2.5 px-5 text-xs font-black shadow-lg shadow-rose-600/30 self-start md:self-auto shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call 112 Emergency</span>
          </a>
        </div>

        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Care Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Available Doctors & Emergency Ambulances
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Browse licensed clinical medical officers available for tele-triage review and active emergency ambulance vehicles on standby.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search doctor, vehicle, station…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 text-xs"
              />
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="btn-secondary py-2 px-3 text-xs font-semibold"
              title="Refresh provider availability"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: `All Network (${doctors.length + ambulances.length})` },
            { id: 'doctors', label: `Verified Doctors (${doctors.length})` },
            { id: 'ambulances', label: `Ambulance Fleet (${ambulances.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-10">
            {(activeTab === 'all' || activeTab === 'doctors') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                    <span>Verified Medical Officers & Specialists ({filteredDoctors.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                              Verified Practitioner
                            </span>
                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                              {doc.name}
                            </h3>
                            <p className="text-xs text-slate-300 font-medium">
                              {doc.specialization}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Available ✓
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                          <p className="flex items-center justify-between">
                            <span>Registration Number:</span>
                            <strong className="font-mono text-emerald-400">{doc.registrationNumber}</strong>
                          </p>
                          <p className="flex items-center justify-between">
                            <span>Clinical Experience:</span>
                            <strong className="text-slate-200">{doc.experienceYears} Years</strong>
                          </p>
                          <p className="flex items-center justify-between">
                            <span>Consultation Hours:</span>
                            <span className="text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {doc.opdTiming}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800">
                        <Link
                          to="/intake"
                          className="btn-primary w-full py-2 text-xs font-bold"
                        >
                          <span>Start Voice Triage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}

                  {filteredDoctors.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                      No doctors matched your search term.
                    </div>
                  )}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'ambulances') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-rose-400" />
                    <span>Active Emergency Ambulance Units ({filteredAmbulances.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAmbulances.map((amb) => (
                    <div
                      key={amb.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4 transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                              Emergency Fleet
                            </span>
                            <h3 className="text-lg font-bold font-mono text-white group-hover:text-rose-300 transition-colors">
                              {amb.vehicleNumber}
                            </h3>
                            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-400" />
                              <span>{amb.stationName}</span>
                            </p>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              amb.status === 'dispatched' || amb.status === 'busy'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {amb.status || 'available'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                          <p className="flex items-center justify-between">
                            <span>Fleet Agency:</span>
                            <strong className="text-slate-200">{amb.serviceProvider}</strong>
                          </p>
                          <p className="flex items-center justify-between">
                            <span>Assigned Operator:</span>
                            <strong className="text-slate-200">{amb.operatorName}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex gap-2">
                        <a
                          href={`tel:${amb.operatorPhone}`}
                          className="btn-secondary flex-1 py-2 text-xs font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Station</span>
                        </a>
                        <a
                          href="tel:112"
                          className="btn-danger flex-1 py-2 text-xs font-bold"
                        >
                          <span>112 SOS</span>
                        </a>
                      </div>
                    </div>
                  ))}

                  {filteredAmbulances.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                      No ambulance units matched your search term.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
