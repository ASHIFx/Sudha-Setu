import { useEffect, useState, useCallback } from 'react';
import { X, Download, Plus, Trash2, Loader2, User, Activity } from 'lucide-react';
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
      toast.success('Ambulance dispatch command transmitted.');
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
      toast.success('Clinical case record updated.');
      fetchCase();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update record');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/cases/${caseId}/pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative w-full max-w-2xl bg-slate-900 shadow-2xl overflow-y-auto flex flex-col z-10 border-l border-slate-800 text-slate-100">
        <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Clinical Consultation Record</span>
            </h2>
            <p className="text-[11px] font-mono text-slate-400">Case ID: {caseId}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" aria-label="Close drawer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <Spinner size="lg" />
          </div>
        ) : caseDoc ? (
          <div className="flex-1 p-6 space-y-6 text-xs text-slate-300">
            <section className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Patient Demographics</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Name</span>
                  <span className="font-bold text-white text-sm">{caseDoc.patientId?.name ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Phone</span>
                  <span className="font-medium text-slate-200">{caseDoc.patientId?.phone ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Email</span>
                  <span className="font-medium text-slate-200 truncate block">{caseDoc.patientId?.email ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">ABHA Number</span>
                  <span className="font-mono text-emerald-400">{caseDoc.patientId?.abhaId ?? 'Not linked'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Intake Language</span>
                  <span className="font-medium uppercase text-slate-200">{caseDoc.languageUsed ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Triage Assessment</span>
                  <span className={`inline-block font-bold uppercase text-[10px] px-2 py-0.5 rounded-full border ${
                    caseDoc.dangerLevel === 'high'
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      : caseDoc.dangerLevel === 'medium'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {caseDoc.dangerLevel} Risk
                  </span>
                </div>
              </div>

              {caseDoc.dangerLevel === 'high' && (
                <div className="mt-2 pt-3 border-t border-rose-500/30 flex items-center justify-between bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">
                  <div>
                    <p className="font-bold text-rose-300 text-xs">High Risk Critical Escalation</p>
                    <p className="text-[11px] text-rose-400">Immediate hospital & ambulance dispatch protocol</p>
                  </div>
                  <button
                    onClick={handleDispatchAmbulance}
                    disabled={dispatching || caseDoc.status === 'emergency_alerted'}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold disabled:opacity-60 shadow-md shadow-rose-600/30 transition-colors"
                  >
                    {caseDoc.status === 'emergency_alerted' ? 'Ambulance Alerted ✓' : dispatching ? 'Transmitting…' : 'Dispatch Ambulance'}
                  </button>
                </div>
              )}
            </section>

            {caseDoc.symptoms?.length > 0 && (
              <section className="space-y-2">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Extracted Symptoms
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {caseDoc.symptoms.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950/80 text-slate-200 border border-slate-800">
                      <strong>{s.name}</strong>
                      {s.duration && <span className="text-slate-400 ml-1">({s.duration})</span>}
                      {s.severity && <span className="text-emerald-400 ml-1 font-semibold">[{s.severity}/10]</span>}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {caseDoc.rawDialogue?.length > 0 && (
              <section className="space-y-1.5">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Patient Voice Transcript
                </h3>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl italic text-slate-200 leading-relaxed max-h-32 overflow-y-auto">
                  "{caseDoc.rawDialogue[0]?.message}"
                </div>
              </section>
            )}

            <section className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Ayurvedic Diagnostic Markers
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Suspected Prakriti</label>
                  <select
                    className="input text-xs py-1.5"
                    value={ayurvedicMarkers.suspectedPrakriti}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, suspectedPrakriti: e.target.value }))}
                  >
                    {PRAKRITI_OPTIONS.map((o) => (
                      <option key={o} value={o} className="bg-slate-900 text-white capitalize">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Agni Status (Digestive Fire)</label>
                  <select
                    className="input text-xs py-1.5"
                    value={ayurvedicMarkers.agniStatus}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, agniStatus: e.target.value }))}
                  >
                    {AGNI_OPTIONS.map((o) => (
                      <option key={o} value={o} className="bg-slate-900 text-white capitalize">{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dietary Habits (Ahara)</label>
                  <input
                    className="input text-xs py-1.5"
                    value={ayurvedicMarkers.dietHabits}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, dietHabits: e.target.value }))}
                    placeholder="e.g. Irregular, pungent, oily"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sleep Pattern (Nidra)</label>
                  <input
                    className="input text-xs py-1.5"
                    value={ayurvedicMarkers.sleepPattern}
                    onChange={(e) => setAyurvedicMarkers((m) => ({ ...m, sleepPattern: e.target.value }))}
                    placeholder="e.g. Disturbed, 5-6 hours"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Clinical Prescription & Treatment Regimen
                </h3>
                <button type="button" onClick={addRxRow} className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer">
                  <Plus className="w-3 h-3" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2">
                {prescription.map((rx, i) => (
                  <div key={i} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between font-semibold text-[11px] text-slate-400">
                      <span>Item #{i + 1}</span>
                      {prescription.length > 1 && (
                        <button type="button" onClick={() => removeRxRow(i)} className="text-slate-500 hover:text-rose-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Medicine Name</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.medicineName}
                          onChange={(e) => updateRxRow(i, 'medicineName', e.target.value)}
                          placeholder="e.g. Triphala Churna"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Dosage</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.dosage}
                          onChange={(e) => updateRxRow(i, 'dosage', e.target.value)}
                          placeholder="e.g. 3g"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Timing</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.timing}
                          onChange={(e) => updateRxRow(i, 'timing', e.target.value)}
                          placeholder="e.g. Bedtime"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Duration</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.duration}
                          onChange={(e) => updateRxRow(i, 'duration', e.target.value)}
                          placeholder="e.g. 14 days"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 mb-0.5">Anupana / Vehicle</label>
                        <input
                          className="input text-xs py-1.5"
                          value={rx.instructions}
                          onChange={(e) => updateRxRow(i, 'instructions', e.target.value)}
                          placeholder="e.g. with lukewarm water"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2 pt-3 border-t border-slate-800">
              <label className="block font-bold text-white uppercase tracking-wider text-[11px]">
                Doctor Clinical Notes
              </label>
              <textarea
                className="input text-xs p-3 min-h-[80px]"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Clinical observations, Pathya/Apathya instructions, follow-up timeline..."
              />
            </section>

            <section className="space-y-2 pt-3 border-t border-slate-800">
              <label className="block font-bold text-white uppercase tracking-wider text-[11px]">
                Consultation Status
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CASE_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      status === opt.value
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-700/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Case record could not be retrieved.
          </div>
        )}

        {!loading && caseDoc && (
          <div className="sticky bottom-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 px-6 py-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{saving ? 'Saving Changes…' : 'Save & Update Clinical Record'}</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
