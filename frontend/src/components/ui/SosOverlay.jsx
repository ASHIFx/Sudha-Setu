import { useEffect, useState } from 'react';
import { Phone, MapPin, Ambulance, X, AlertTriangle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-700 bg-opacity-97 text-white px-4">
      <div className="sos-flash absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center space-y-6">
        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Dismiss SOS overlay"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-black tracking-tight">EMERGENCY ALERT</h1>
          <p className="text-red-200 text-lg mt-2">Critical symptoms detected. Emergency dispatch triggered.</p>
        </div>

        {hospital && (
          <div className="bg-white/10 rounded-2xl p-5 text-left space-y-3">
            <p className="flex items-center gap-2 font-semibold text-lg">
              <MapPin className="w-5 h-5 text-red-200" /> Assigned Nearest Hospital
            </p>
            <div>
              <p className="font-bold text-xl">{hospital.name}</p>
              {hospital.phone && (
                <p className="text-red-200 text-sm">Emergency Desk: {hospital.phone}</p>
              )}
            </div>
            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                className="flex items-center gap-3 bg-white text-red-700 font-bold rounded-xl px-5 py-3 hover:bg-red-50 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Hospital: {hospital.phone}
              </a>
            )}
          </div>
        )}

        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Ambulance className="w-6 h-6 text-red-200 flex-shrink-0" />
            {dispatched ? (
              <div className="text-left">
                <p className="font-bold text-lg">Ambulance Dispatched ✓</p>
                <p className="text-red-200 text-sm">
                  {dispatchInfo?.status === 'accepted'
                    ? 'Unit is en route to patient coordinates'
                    : 'Dispatch recorded. Emergency responder alerted.'}
                </p>
              </div>
            ) : (
              <div className="text-left">
                <p className="font-bold text-lg">Contacting Emergency Fleet…</p>
                <p className="text-red-200 text-sm">
                  Auto-connecting in <span className="text-white font-black text-xl">{countdown}s</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <a
          href="tel:112"
          className="flex items-center justify-center gap-3 w-full bg-white text-red-700 font-black text-xl rounded-2xl py-4 hover:bg-red-50 transition-colors shadow-lg"
        >
          <Phone className="w-6 h-6" />
          Call 112 — National Emergency
        </a>

        {caseId && (
          <p className="text-red-300 text-xs">Case ref: {caseId}</p>
        )}
      </div>
    </div>
  );
}
