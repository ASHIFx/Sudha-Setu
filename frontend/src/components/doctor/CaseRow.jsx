const DANGER_BADGE = {
  high: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
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
      className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/40'}`}
      onClick={() => onOpen(caseDoc)}
    >
      <td className="px-4 py-3.5">
        <div>
          <p className="font-bold text-white text-xs">{patient.name ?? 'Anonymous Patient'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{patient.phone ?? patient.email ?? 'ID: ' + caseDoc._id.slice(-6)}</p>
        </div>
      </td>

      <td className="px-4 py-3.5 hidden sm:table-cell max-w-[240px]">
        <p className="text-xs text-slate-300 truncate font-normal">{symptomText}</p>
      </td>

      <td className="px-4 py-3.5">
        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${DANGER_BADGE[caseDoc.dangerLevel] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}>
          {caseDoc.dangerLevel} Risk
        </span>
      </td>

      <td className="px-4 py-3.5 hidden md:table-cell">
        <span className="text-[11px] font-medium text-slate-300 bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded-md">
          {STATUS_LABEL[caseDoc.status] ?? caseDoc.status}
        </span>
      </td>

      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-[11px] font-mono">
        {new Date(caseDoc.createdAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </td>

      <td className="px-4 py-3.5 text-right">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(caseDoc); }}
          className="px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
        >
          Review Case
        </button>
      </td>
    </tr>
  );
}
