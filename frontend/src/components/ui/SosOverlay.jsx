import { useEffect, useState } from 'react';
import { Phone, MapPin, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="bg-red-800 text-white max-w-lg w-full rounded border-2 border-red-500 shadow-2xl p-6 space-y-5 relative">
        <div className="flex items-start justify-between border-b border-red-700 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-red-950 text-red-200 px-2 py-0.5 rounded">
              Critical Emergency Alert
            </span>
            <h2 className="text-xl font-black mt-1">Tier 3: High Risk Condition Detected</h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded text-red-200 hover:text-white hover:bg-red-700 transition-colors"
            aria-label="Dismiss SOS overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-red-100 leading-relaxed">
          Critical symptom indicators have been triggered. The platform has initiated automated emergency hospital lookup and vehicle dispatch.
        </p>

        {hospital && (
          <div className="bg-red-900/80 border border-red-700 rounded p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-red-100 uppercase tracking-wide text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-red-300" />
              <span>Assigned Emergency Facility</span>
            </div>
            <div>
              <p className="font-bold text-sm text-white">{hospital.name}</p>
              {hospital.phone && (
                <p className="text-red-200 text-xs mt-0.5">Emergency Desk: {hospital.phone}</p>
              )}
            </div>
            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                className="inline-flex items-center gap-2 bg-white text-red-900 font-bold px-3 py-1.5 rounded text-xs hover:bg-red-50 transition-colors mt-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Hospital Direct</span>
              </a>
            )}
          </div>
        )}

        <div className="bg-red-900/80 border border-red-700 rounded p-4 text-xs space-y-1">
          <p className="font-bold text-red-100 uppercase tracking-wide text-[11px]">Ambulance Dispatch State</p>
          {dispatched ? (
            <p className="text-white font-medium">
              Ambulance dispatch record created. Status: <strong className="uppercase font-bold underline">{dispatchInfo?.status || 'dispatched'}</strong>
            </p>
          ) : (
            <p className="text-red-200">
              Connecting to nearest emergency ambulance unit... ({countdown}s)
            </p>
          )}
        </div>

        <div className="pt-2">
          <a
            href="tel:112"
            className="w-full flex items-center justify-center gap-2 bg-white text-red-900 font-black text-sm py-3 rounded hover:bg-red-50 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Call 112 (National Emergency Helpline)</span>
          </a>
        </div>

        {caseId && (
          <div className="text-[10px] text-red-300 text-center font-mono">
            Emergency Case Identifier: {caseId}
          </div>
        )}
      </div>
    </div>
  );
}
