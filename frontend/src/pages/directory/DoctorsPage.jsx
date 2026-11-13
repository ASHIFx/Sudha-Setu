import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, ShieldCheck, Clock, Award, Phone, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import Spinner from '../../components/ui/Spinner.jsx';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const navigate = useNavigate();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/directory/all');
      setDoctors(data.doctors || []);
    } catch {
      toast.error('Failed to load doctors roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const specialties = useMemo(() => {
    const set = new Set();
    doctors.forEach((d) => {
      if (d.specialization) set.add(d.specialization);
    });
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        (d.city && d.city.toLowerCase().includes(q)) ||
        d.registrationNumber.toLowerCase().includes(q);

      const matchSpecialty =
        specialtyFilter === 'all' || d.specialization === specialtyFilter;

      return matchSearch && matchSpecialty;
    });
  }, [doctors, search, specialtyFilter]);

  const handleBookConsult = (doc) => {
    navigate('/intake', { state: { prefilledText: `Requesting clinical consultation with ${doc.name} (${doc.specialization}).` } });
  };

  return (
    <div className="bg-[#04150E] min-h-[calc(100vh-4rem)] py-8 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-[#062016]/90 border border-[#124731] rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
              <span>Certified BAMS & MD Ayurvedic Practitioners</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
              Verified Ayurvedic Doctors
            </h1>
            <p className="text-sm text-emerald-100/70 leading-relaxed">
              Connect with registered medical officers, clinical pharmacologists, and Panchakarma specialists. Filter by clinical specialty, experience, and book digital OPD consultations directly.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor by name, specialty, registration..."
              className="w-full bg-[#062016] border border-[#124731] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-emerald-100/40 focus:outline-none focus:border-emerald-500/60 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSpecialtyFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                specialtyFilter === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-[#062016] text-emerald-100/70 border-[#124731] hover:text-white hover:bg-[#0B2E20]'
              }`}
            >
              All Specialties
            </button>
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialtyFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  specialtyFilter === s
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-[#062016] text-emerald-100/70 border-[#124731] hover:text-white hover:bg-[#0B2E20]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="card text-center py-16 space-y-3">
            <Stethoscope className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">No doctors match your search or specialty filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#062016]/90 border border-[#124731] hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-5 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-serif text-lg font-bold group-hover:scale-105 transition-transform">
                        {doc.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-base font-serif font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {doc.name}
                          </h2>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-xs text-emerald-400 font-medium">{doc.degree || 'BAMS, MD (Ayurveda)'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-emerald-100/70">
                      <span className="font-semibold text-emerald-300">Specialty:</span>
                      <span>{doc.specialization}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-100/70">
                      <span className="font-semibold text-emerald-300">Experience:</span>
                      <span>{doc.experienceYears} Years Clinical Practice</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-100/70">
                      <span className="font-semibold text-emerald-300">Registration:</span>
                      <span className="font-mono text-[11px] text-slate-400">{doc.registrationNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-100/70">
                      <span className="font-semibold text-emerald-300">OPD Timings:</span>
                      <span>{doc.opdTiming || '09:00 AM - 05:00 PM'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#124731] text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-100/60 uppercase font-semibold block">Consultation Fee</span>
                      <span className="text-sm font-bold text-emerald-400 mt-0.5 block">₹{doc.consultationFee || 500}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-100/60 uppercase font-semibold block">Languages</span>
                      <span className="text-xs text-slate-300 mt-0.5 block">{doc.languages?.join(', ') || 'Hindi, English'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#124731] flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleBookConsult(doc)}
                    className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Book OPD Consultation</span>
                  </button>
                  {doc.phone && (
                    <a
                      href={`tel:${doc.phone}`}
                      className="p-2.5 rounded-xl bg-[#04150E] border border-[#124731] text-emerald-400 hover:text-white hover:bg-[#0B2E20] transition-colors"
                      title="Direct Contact"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
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