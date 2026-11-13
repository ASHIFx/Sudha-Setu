import { useEffect, useState } from 'react';
import { Phone, MapPin, X, AlertTriangle } from 'lucide-react';
import api from '../../lib/api.js';

export default function SosOverlay({ caseId, onDismiss }) {
  const [countdown, setCountdown] = useState(10);
  const [dispatched, setDispatched] = useState(false);
  const [hospital, setHospital] = useState(null);
  const [dispatchInfo, setDispatchInfo] = useState(null);

  const triggerDispatch = async () => {
    if (!caseId) return;
    try {
      const { data } = await api.post('/ambulance/dispatch', { caseId });
      setDispatchInfo(data.dispatch);
      if (data.hospital) {
        setHospital(data.hospital);
      }
      setDispatched(true);
    } catch (err) {
      console.warn('[sos] Dispatch request failed:', err.message);
    }
  };

  useEffect(() => {
    triggerDispatch();

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [caseId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-gradient-to-b from-rose-950/95 to-slate-950/95 text-white max-w-lg w-full rounded-2xl border-2 border-rose-500/80 shadow-2xl shadow-rose-950/50 p-6 space-y-5 relative">
        <div className="flex items-start justify-between border-b border-rose-900/60 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Critical Emergency Alert</span>
            </div>
            <h2 className="text-xl font-black mt-1 text-white">Tier 3: High Risk Condition Detected</h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 transition-colors"
            aria-label="Dismiss SOS overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-rose-200 leading-relaxed">
          Critical symptom indicators have been triggered. The platform has initiated automated emergency hospital lookup and vehicle dispatch.
        </p>

        {hospital && (
          <div className="bg-slate-900/80 border border-rose-500/40 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-300 uppercase tracking-wide text-[11px]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Assigned Emergency Facility</span>
            </div>
            <div>
              <p className="font-bold text-sm text-white">{hospital.name}</p>
              {hospital.phone && (
                <p className="text-rose-300 text-xs mt-0.5">Emergency Desk: {hospital.phone}</p>
              )}
            </div>
            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors mt-1 shadow-md shadow-rose-600/30"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Hospital Direct</span>
              </a>
            )}
          </div>
        )}

        <div className="bg-slate-900/80 border border-rose-500/40 rounded-xl p-4 text-xs space-y-1">
          <p className="font-bold text-rose-300 uppercase tracking-wide text-[11px]">Ambulance Dispatch State</p>
          {dispatched ? (
            <p className="text-white font-medium">
              Ambulance dispatch record created. Status: <strong className="uppercase font-bold text-rose-400 underline">{dispatchInfo?.status || 'dispatched'}</strong>
            </p>
          ) : (
            <p className="text-rose-300">
              Connecting to nearest emergency ambulance unit... ({countdown}s)
            </p>
          )}
        </div>

        <div className="pt-2">
          <a
            href="tel:112"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm py-3 rounded-xl transition-all shadow-lg shadow-rose-600/40 cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Call 112 (National Emergency Helpline)</span>
          </a>
        </div>

        {caseId && (
          <div className="text-[10px] text-rose-400 text-center font-mono">
            Emergency Case Identifier: {caseId}
          </div>
        )}
      </div>
    </div>
  );
}
