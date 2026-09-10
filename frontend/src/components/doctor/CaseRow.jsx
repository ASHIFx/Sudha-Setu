import { AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

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
  emergency_alerted: 'Emergency',
  resolved_selfcare: 'Self-Care',
  completed: 'Completed',
};

const DANGER_ICON = {
  high: <AlertTriangle className="w-3.5 h-3.5" />,
  medium: <Clock className="w-3.5 h-3.5" />,
  low: <CheckCircle className="w-3.5 h-3.5" />,
};

export default function CaseRow({ caseDoc, onOpen, index }) {
  const patient = caseDoc.patient ?? {};
  const symptoms = caseDoc.symptoms ?? [];
  const symptomText = symptoms.length > 0
    ? symptoms.slice(0, 3).map((s) => s.name).join(', ')
    : caseDoc.firstMessage?.slice(0, 80) ?? '—';

  return (
    <tr
      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
      onClick={() => onOpen(caseDoc)}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{patient.name ?? 'Unknown'}</p>
            <p className="text-xs text-slate-400">{patient.phone ?? '—'}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 hidden sm:table-cell">
        <p className="text-sm text-slate-600 max-w-xs truncate">{symptomText}</p>
      </td>

      <td className="px-4 py-4">
        <span className={`${DANGER_BADGE[caseDoc.dangerLevel] ?? 'badge-green'} gap-1`}>
          {DANGER_ICON[caseDoc.dangerLevel]}
          <span className="capitalize">{caseDoc.dangerLevel}</span>
        </span>
      </td>

      <td className="px-4 py-4 hidden md:table-cell">
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
          {STATUS_LABEL[caseDoc.status] ?? caseDoc.status}
        </span>
      </td>

      <td className="px-4 py-4 hidden lg:table-cell">
        <p className="text-xs text-slate-400">
          {new Date(caseDoc.createdAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </td>

      <td className="px-4 py-4">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(caseDoc); }}
          className="btn-outline px-3 py-1.5 text-sm"
        >
          Open
        </button>
      </td>
    </tr>
  );
}
