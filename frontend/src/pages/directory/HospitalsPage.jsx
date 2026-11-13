import { useState, useEffect, useMemo } from 'react';
import { Building2, MapPin, Phone, ShieldCheck, Search, AlertTriangle, Activity, Stethoscope, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import Spinner from '../../components/ui/Spinner.jsx';

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/directory/all');
      setHospitals(data.hospitals || []);
    } catch {
      toast.error('Failed to load hospitals directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const q = search.toLowerCase();
      const matchSearch =
        h.name.toLowerCase().includes(q) ||
        h.city?.toLowerCase().includes(q) ||
        h.address?.toLowerCase().includes(q) ||
        (h.specialties || []).some((s) => s.toLowerCase().includes(q));

      const matchFilter =
        filter === 'all' ||
        (filter === 'emergency' && h.emergencyCapable) ||
        (filter === 'panchakarma' && (h.panchakarmaUnits > 8 || h.name.toLowerCase().includes('panchakarma') || (h.specialties || []).some((s) => s.toLowerCase().includes('panchakarma'))));

      return matchSearch && matchFilter;
    });
  }, [hospitals, search, filter]);

  return (
    <div className="bg-[#04150E] min-h-[calc(100vh-4rem)] py-8 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-[#062016]/90 border border-[#124731] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>NABH Accredited & Apex Ayurveda Centers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Ayurveda Hospitals & Panchakarma Clinics
            </h1>
            <p className="text-sm text-emerald-100/70 leading-relaxed">
              Explore premier government and private Ayurvedic healthcare institutions, apex clinical research centers, and specialized Panchakarma wellness facilities with live bed capacity and emergency capabilities.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Emergency 24x7 Ambulance & Hospital Triage
              </h2>
              <p className="text-xs text-rose-200/90 mt-0.5">
                For acute emergencies, severe trauma, or cardiac arrest, dial 112 directly. On-duty ambulances stream GPS runs in real time.
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hospital name, city, specialty..."
              className="w-full bg-[#062016] border border-[#124731] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-emerald-100/40 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Centers' },
              { id: 'emergency', label: '24x7 Emergency Capable' },
              { id: 'panchakarma', label: 'Panchakarma CoE' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  filter === t.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-[#062016] text-emerald-100/70 border-[#124731] hover:text-white hover:bg-[#0B2E20]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="card text-center py-16 space-y-3">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">No healthcare facilities match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((h) => (
              <div
                key={h.id || h.name}
                className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-5 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {h.accreditation || 'NABH Accredited Center'}
                      </span>
                      <h2 className="text-lg font-serif font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors">
                        {h.name}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="flex items-start gap-2 text-emerald-100/70">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h.address}, {h.city}</span>
                    </p>
                    <p className="flex items-center gap-2 text-emerald-100/70">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{h.phone}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center pt-2">
                    <div className="p-2.5 rounded-xl bg-[#04150E] border border-[#124731]">
                      <span className="text-[10px] text-emerald-100/60 uppercase font-semibold block">Inpatient Beds</span>
                      <span className="text-base font-bold text-white mt-0.5 block">{h.inpatientBeds || 120}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#04150E] border border-[#124731]">
                      <span className="text-[10px] text-emerald-100/60 uppercase font-semibold block">Panchakarma Units</span>
                      <span className="text-base font-bold text-emerald-400 mt-0.5 block">{h.panchakarmaUnits || 8}</span>
                    </div>
                  </div>

                  {h.specialties?.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#124731]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        Departments & Specialties
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {h.specialties.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-200 border border-emerald-500/20"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#124731] flex items-center gap-3">
                  <a
                    href={`tel:${h.phone}`}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Reception</span>
                  </a>
                  {h.emergencyCapable && (
                    <span className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      <span>24x7 Triage</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}