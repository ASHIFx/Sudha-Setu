import { AlertTriangle, CheckCircle, Clock, User, ArrowRight } from 'lucide-react';

const DANGER_BADGE = {
  high: 'badge-red',
  medium: 'badge-amber',
  low: 'badge-green',
};

const STATUS_LABEL = {
  pending_doctor: 'Pending Doctor',
  queued_for_doctor: 'In Queue',
  in_consultation: 'In Consultation',
  escalated_human: 'Escalated',
  emergency_alerted: 'Emergency Alerted',
  resolved_selfcare: 'Self-Care',
  completed: 'Completed',
};

const DANGER_ICON = {
  high: <AlertTriangle className="w-3 h-3" />,
  medium: <Clock className="w-3 h-3" />,
  low: <CheckCircle className="w-3 h-3" />,
};

export default function CaseRow({ caseDoc, onOpen, index }) {
  const patient = caseDoc.patient ?? {};
  const symptoms = caseDoc.symptoms ?? [];
  const symptomText = symptoms.length > 0
    ? symptoms.slice(0, 3).map((s) => s.name).join(', ')
    : caseDoc.firstMessage?.slice(0, 80) ?? '—';

  return (
    <tr
      className={`hover:bg-brand-50/40 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
      onClick={() => onOpen(caseDoc)}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100/80 border border-brand-200 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-brand-700" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{patient.name ?? 'Anonymous Patient'}</p>
            <p className="text-[11px] text-slate-400">{patient.phone ?? patient.email ?? 'ID: ' + caseDoc._id.slice(-6)}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-3.5 hidden sm:table-cell max-w-[240px]">
        <p className="text-xs text-slate-600 truncate font-normal">{symptomText}</p>
      </td>

      <td className="px-5 py-3.5">
        <span className={`${DANGER_BADGE[caseDoc.dangerLevel] ?? 'badge-green'} gap-1 text-[11px]`}>
          {DANGER_ICON[caseDoc.dangerLevel]}
          <span className="capitalize font-semibold">{caseDoc.dangerLevel}</span>
        </span>
      </td>

      <td className="px-5 py-3.5 hidden md:table-cell">
        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
          {STATUS_LABEL[caseDoc.status] ?? caseDoc.status}
        </span>
      </td>

      <td className="px-5 py-3.5 hidden lg:table-cell">
        <p className="text-xs text-slate-400">
          {new Date(caseDoc.createdAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </td>

      <td className="px-5 py-3.5 text-right">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(caseDoc); }}
          className="btn-secondary px-2.5 py-1 text-xs font-semibold hover:border-brand-500 hover:text-brand-700 inline-flex items-center gap-1"
        >
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
}
