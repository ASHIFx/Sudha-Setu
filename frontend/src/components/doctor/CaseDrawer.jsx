import { useEffect, useState, useCallback } from 'react';
import { X, Download, Plus, Trash2, Loader2, User, FileText, Leaf, Pill } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api.js';
import Spinner from '../ui/Spinner.jsx';

const PRAKRITI_OPTIONS = ['unknown', 'vata', 'pitta', 'kapha', 'vata-pitta', 'pitta-kapha', 'vata-kapha', 'tridosha'];
const AGNI_OPTIONS = ['unknown', 'sama', 'vishama', 'tikshna', 'manda'];
const CASE_STATUS_OPTIONS = [
  { value: 'in_consultation', label: 'In Consultation' },
  { value: 'resolved_selfcare', label: 'Resolved — Self Care' },
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
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <aside className="w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900">Case Sheet</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="btn-ghost px-3 py-2 text-sm flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Close drawer">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : caseDoc ? (
          <div className="flex-1 p-6 space-y-8">
            <section className="card space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" /> Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Name</p>
                  <p className="font-semibold">{caseDoc.patientId?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Phone</p>
                  <p className="font-semibold">{caseDoc.patientId?.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Email</p>
                  <p className="font-semibold">{caseDoc.patientId?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">ABHA ID</p>
                  <p className="font-semibold">{caseDoc.patientId?.abhaId ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Language</p>
                  <p className="font-semibold capitalize">{caseDoc.languageUsed ?? '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Danger Level</p>
                  <p className={`font-bold capitalize ${caseDoc.dangerLevel === 'high' ? 'text-red-600' : caseDoc.dangerLevel === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                    {caseDoc.dangerLevel}
                  </p>
                </div>
              </div>
            </section>

            {caseDoc.symptoms?.length > 0 && (
              <section className="card space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" /> Reported Symptoms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {caseDoc.symptoms.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-medium capitalize">
                      {s.name}
                      {s.duration && <span className="text-slate-400 ml-1">· {s.duration}</span>}
                      {s.severity && <span className="text-slate-400 ml-1">· {s.severity}/10</span>}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {caseDoc.rawDialogue?.length > 0 && (
              <section className="card space-y-3">
                <h3 className="font-bold text-slate-900">Patient's Description</h3>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
                  {caseDoc.rawDialogue[0]?.message}
                </div>
              </section>
            )}

            <section className="card space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-600" /> Ayurvedic Parameters
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Suspected Prakriti</label>
                  <select
                    className="input"
                    value={ayurvedicMarkers.suspectedPrakriti}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, suspectedPrakriti: e.target.value }))}
                  >
                    {PRAKRITI_OPTIONS.map((o) => (
                      <option key={o} value={o} className="capitalize">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Agni Status</label>
                  <select
                    className="input"
                    value={ayurvedicMarkers.agniStatus}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, agniStatus: e.target.value }))}
                  >
                    {AGNI_OPTIONS.map((o) => (
                      <option key={o} value={o} className="capitalize">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Diet Habits</label>
                  <input
                    className="input"
                    value={ayurvedicMarkers.dietHabits}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, dietHabits: e.target.value }))}
                    placeholder="e.g. vegetarian, light meals"
                  />
                </div>
                <div>
                  <label className="label">Sleep Pattern</label>
                  <input
                    className="input"
                    value={ayurvedicMarkers.sleepPattern}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, sleepPattern: e.target.value }))}
                    placeholder="e.g. 6-7 hrs, disturbed"
                  />
                </div>
              </div>
            </section>

            <section className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-brand-600" /> Prescription
                </h3>
                <button onClick={addRxRow} className="btn-ghost px-3 py-1.5 text-sm flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="space-y-3">
                {prescription.map((rx, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine {i + 1}</p>
                      {prescription.length > 1 && (
                        <button onClick={() => removeRxRow(i)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="label">Medicine Name *</label>
                        <input
                          className="input"
                          value={rx.medicineName}
                          onChange={(e) => updateRxRow(i, 'medicineName', e.target.value)}
                          placeholder="e.g. Triphala Churna"
                        />
                      </div>
                      <div>
                        <label className="label">Dosage</label>
                        <input
                          className="input"
                          value={rx.dosage}
                          onChange={(e) => updateRxRow(i, 'dosage', e.target.value)}
                          placeholder="e.g. 5g"
                        />
                      </div>
                      <div>
                        <label className="label">Timing</label>
                        <input
                          className="input"
                          value={rx.timing}
                          onChange={(e) => updateRxRow(i, 'timing', e.target.value)}
                          placeholder="e.g. after meals"
                        />
                      </div>
                      <div>
                        <label className="label">Duration</label>
                        <input
                          className="input"
                          value={rx.duration}
                          onChange={(e) => updateRxRow(i, 'duration', e.target.value)}
                          placeholder="e.g. 14 days"
                        />
                      </div>
                      <div>
                        <label className="label">Special Instructions</label>
                        <input
                          className="input"
                          value={rx.instructions}
                          onChange={(e) => updateRxRow(i, 'instructions', e.target.value)}
                          placeholder="e.g. with warm water"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card space-y-3">
              <label className="label text-base font-bold text-slate-900">Doctor Notes</label>
              <textarea
                className="input min-h-[100px] resize-y"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Clinical observations, follow-up instructions, referrals..."
              />
            </section>

            <section className="card space-y-3">
              <label className="label">Update Case Status</label>
              <div className="flex flex-wrap gap-2">
                {CASE_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      status === opt.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Case not found.
          </div>
        )}

        {!loading && caseDoc && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary w-full py-4 text-lg"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save & Update Case'}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
