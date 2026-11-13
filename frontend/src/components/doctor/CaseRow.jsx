const DANGER_BADGE = {
  high: 'bg-rose-50 text-rose-800 border-rose-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const STATUS_LABEL = {
  pending_doctor: 'Pending Doctor',
  queued_for_doctor: 'Queued in OPD',
  in_consultation: 'In Consultation',
  escalated_human: 'Escalated',
  emergency_alerted: 'Emergency SOS',
  resolved_selfcare: 'Self-Care Closed',
  completed: 'Completed',
};

export default function CaseRow({ caseDoc, onOpen, index }) {
  const patient = caseDoc.patient ?? {};
  const symptoms = caseDoc.symptoms ?? [];
  const symptomText = symptoms.length > 0
    ? symptoms.slice(0, 3).map((s) => s.name).join(', ')
    : caseDoc.firstMessage?.slice(0, 80) ?? '—';

  return (
    <tr
      className={`hover:bg-slate-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
      onClick={() => onOpen(caseDoc)}
    >
      <td className="px-4 py-3">
        <div>
          <p className="font-bold text-slate-900 text-xs">{patient.name ?? 'Anonymous Patient'}</p>
          <p className="text-[11px] text-slate-400">{patient.phone ?? patient.email ?? 'ID: ' + caseDoc._id.slice(-6)}</p>
        </div>
      </td>

      <td className="px-4 py-3 hidden sm:table-cell max-w-[240px]">
        <p className="text-xs text-slate-600 truncate font-normal">{symptomText}</p>
      </td>

      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${DANGER_BADGE[caseDoc.dangerLevel] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
          {caseDoc.dangerLevel} Risk
        </span>
      </td>

      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          {STATUS_LABEL[caseDoc.status] ?? caseDoc.status}
        </span>
      </td>

      <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-[11px]">
        {new Date(caseDoc.createdAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>

      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(caseDoc); }}
          className="px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-300 rounded hover:bg-slate-100"
        >
          Review
        </button>
      </td>
    </tr>
  );
}
