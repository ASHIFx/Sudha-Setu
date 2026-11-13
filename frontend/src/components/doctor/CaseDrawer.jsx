import { useEffect, useState, useCallback } from 'react';
import { X, Download, Plus, Trash2, Loader2, User, FileText, Leaf, Pill, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import Spinner from '../ui/Spinner.jsx';

const PRAKRITI_OPTIONS = ['unknown', 'vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'tridosha'];
const AGNI_OPTIONS = ['unknown', 'sama', 'vishama', 'tikshna', 'manda'];
const CASE_STATUS_OPTIONS = [
  { value: 'in_consultation', label: 'In Consultation' },
  { value: 'resolved_selfcare', label: 'Resolved (Self Care)' },
  { value: 'completed', label: 'Completed' },
];

const EMPTY_RX = { medicineName: '', dosage: '', timing: '', duration: '', instructions: '' };

export default function CaseDrawer({ caseId, onClose }) {
  const [caseDoc, setCaseDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [doctorNotes, setDoctorNotes] = useState('');
  const [status, setStatus] = useState('in_consultation');
  const [ayurvedicMarkers, setAyurvedicMarkers] = useState({
    suspectedPrakriti: 'unknown',
    agniStatus: 'unknown',
    dietHabits: '',
    sleepPattern: '',
  });
  const [prescription, setPrescription] = useState([{ ...EMPTY_RX }]);
  const [dispatching, setDispatching] = useState(false);

  const handleDispatchAmbulance = async () => {
    setDispatching(true);
    try {
      await api.post('/ambulance/dispatch', { caseId });
      toast.success('Emergency ambulance dispatched!');
      fetchCase();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch ambulance');
    } finally {
      setDispatching(false);
    }
  };

  const fetchCase = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/cases/${caseId}`);
      const c = data.case;
      setCaseDoc(c);
      setDoctorNotes(c.doctorNotes ?? '');
      setStatus(c.status ?? 'in_consultation');
      setAyurvedicMarkers({
        suspectedPrakriti: c.ayurvedicMarkers?.suspectedPrakriti ?? 'unknown',
        agniStatus: c.ayurvedicMarkers?.agniStatus ?? 'unknown',
        dietHabits: c.ayurvedicMarkers?.dietHabits ?? '',
        sleepPattern: c.ayurvedicMarkers?.sleepPattern ?? '',
      });
      setPrescription(
        c.prescription?.length > 0
          ? c.prescription.map((rx) => ({ ...EMPTY_RX, ...rx }))
          : [{ ...EMPTY_RX }]
      );
    } catch {
      toast.error('Failed to load case details');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const addRxRow = () => setPrescription((prev) => [...prev, { ...EMPTY_RX }]);

  const removeRxRow = (i) =>
    setPrescription((prev) => prev.filter((_, idx) => idx !== i));

  const updateRxRow = (i, field, value) =>
    setPrescription((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
    );

  const handleSubmit = async () => {
    const validRx = prescription.filter((rx) => rx.medicineName.trim());
    setSaving(true);
    try {
      await api.patch(`/cases/${caseId}`, {
        status,
        doctorNotes,
        ayurvedicMarkers,
        prescription: validRx,
      });
      toast.success('Case updated successfully');
      fetchCase();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/cases/${caseId}/pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      <aside className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col z-10 border-l border-slate-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ayurvedic Clinical Record</h2>
            <p className="text-xs text-slate-400">Ref: {caseId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Prescription PDF
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Close drawer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : caseDoc ? (
          <div className="flex-1 p-6 space-y-6">
            <section className="card p-5 space-y-3 bg-white border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" /> Patient Demographics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Name</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{caseDoc.patientId?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Phone</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{caseDoc.patientId?.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Email</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{caseDoc.patientId?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">ABHA ID</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{caseDoc.patientId?.abhaId ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Language</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5 capitalize">{caseDoc.languageUsed ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Triage Risk Level</p>
                  <span className={`inline-block mt-0.5 font-bold uppercase text-[11px] px-2 py-0.5 rounded-full ${
                    caseDoc.dangerLevel === 'high'
                      ? 'bg-red-100 text-red-700'
                      : caseDoc.dangerLevel === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {caseDoc.dangerLevel}
                  </span>
                </div>
              </div>

              {caseDoc.dangerLevel === 'high' && (
                <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-200">
                  <div>
                    <p className="font-bold text-red-900 text-xs">High Risk Critical Triage</p>
                    <p className="text-[11px] text-red-700">Immediate hospital & ambulance dispatch protocol</p>
                  </div>
                  <button
                    onClick={handleDispatchAmbulance}
                    disabled={dispatching || caseDoc.status === 'emergency_alerted'}
                    className="btn-danger px-3 py-1.5 text-xs font-bold shadow-sm"
                  >
                    {caseDoc.status === 'emergency_alerted'
                      ? 'Ambulance Alerted ✓'
                      : dispatching
                      ? 'Dispatching…'
                      : 'Dispatch Ambulance'}
                  </button>
                </div>
              )}
            </section>

            {caseDoc.symptoms?.length > 0 && (
              <section className="card p-5 space-y-2.5 bg-white border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" /> Clinical Symptoms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {caseDoc.symptoms.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium capitalize border border-slate-200/60">
                      {s.name}
                      {s.duration && <span className="text-slate-400 ml-1">({s.duration})</span>}
                      {s.severity && <span className="text-brand-600 ml-1 font-semibold">{s.severity}/10</span>}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {caseDoc.rawDialogue?.length > 0 && (
              <section className="card p-5 space-y-2 bg-white border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm">Patient Voice/Text Transcript</h3>
                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
                  {caseDoc.rawDialogue[0]?.message}
                </div>
              </section>
            )}

            <section className="card p-5 space-y-4 bg-white border-slate-200/80">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Leaf className="w-4 h-4 text-brand-600" /> Ayurvedic Dosha & Agni Markers
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="label text-xs">Suspected Prakriti</label>
                  <select
                    className="input text-xs py-2"
                    value={ayurvedicMarkers.suspectedPrakriti}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, suspectedPrakriti: e.target.value }))}
                  >
                    {PRAKRITI_OPTIONS.map((o) => (
                      <option key={o} value={o} className="capitalize">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Agni (Digestive Fire)</label>
                  <select
                    className="input text-xs py-2"
                    value={ayurvedicMarkers.agniStatus}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, agniStatus: e.target.value }))}
                  >
                    {AGNI_OPTIONS.map((o) => (
                      <option key={o} value={o} className="capitalize">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Dietary Habits</label>
                  <input
                    className="input text-xs py-2"
                    value={ayurvedicMarkers.dietHabits}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, dietHabits: e.target.value }))}
                    placeholder="e.g. Satvik, spicy, irregular"
                  />
                </div>
                <div>
                  <label className="label text-xs">Sleep Quality</label>
                  <input
                    className="input text-xs py-2"
                    value={ayurvedicMarkers.sleepPattern}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, sleepPattern: e.target.value }))}
                    placeholder="e.g. 6-7 hrs sound, disturbed"
                  />
                </div>
              </div>
            </section>

            <section className="card p-5 space-y-4 bg-white border-slate-200/80">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Pill className="w-4 h-4 text-brand-600" /> Ayurvedic Prescription
                </h3>
                <button type="button" onClick={addRxRow} className="btn-secondary px-2.5 py-1 text-xs font-semibold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {prescription.map((rx, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Item #{i + 1}</span>
                      {prescription.length > 1 && (
                        <button type="button" onClick={() => removeRxRow(i)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="col-span-2">
                        <label className="label text-[11px]">Medicine Name *</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.medicineName}
                          onChange={(e) => updateRxRow(i, 'medicineName', e.target.value)}
                          placeholder="e.g. Triphala Churna / Giloy Ghanvati"
                        />
                      </div>
                      <div>
                        <label className="label text-[11px]">Dosage</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.dosage}
                          onChange={(e) => updateRxRow(i, 'dosage', e.target.value)}
                          placeholder="e.g. 1 tsp / 2 tabs"
                        />
                      </div>
                      <div>
                        <label className="label text-[11px]">Timing</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.timing}
                          onChange={(e) => updateRxRow(i, 'timing', e.target.value)}
                          placeholder="e.g. Before sleep / post meal"
                        />
                      </div>
                      <div>
                        <label className="label text-[11px]">Duration</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.duration}
                          onChange={(e) => updateRxRow(i, 'duration', e.target.value)}
                          placeholder="e.g. 14 days"
                        />
                      </div>
                      <div>
                        <label className="label text-[11px]">Instructions (Anupana)</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.instructions}
                          onChange={(e) => updateRxRow(i, 'instructions', e.target.value)}
                          placeholder="e.g. with warm water / honey"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-5 space-y-2 bg-white border-slate-200/80">
              <label className="label text-sm font-bold text-slate-900">Doctor Clinical Notes</label>
              <textarea
                className="input min-h-[90px] resize-y text-xs"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Clinical notes, lifestyle guidance (Pathya/Apathya), follow-up timeline..."
              />
            </section>

            <section className="card p-5 space-y-2 bg-white border-slate-200/80">
              <label className="label text-xs font-bold text-slate-700">Update Consultation Status</label>
              <div className="flex flex-wrap gap-2">
                {CASE_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      status === opt.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Case record could not be loaded.
          </div>
        )}

        {!loading && caseDoc && (
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-6 py-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary w-full py-3 text-sm font-bold shadow-sm flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving Changes…' : 'Save & Update Clinical Case'}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
