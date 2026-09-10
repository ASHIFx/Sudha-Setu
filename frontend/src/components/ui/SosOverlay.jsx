import { useEffect, useState } from 'react';
import { Phone, MapPin, Ambulance, X, AlertTriangle } from 'lucide-react';

const MOCK_HOSPITALS = [
  { name: 'AIIMS Rishikesh', phone: '01332-226888', distance: '2.4 km' },
  { name: 'Himalayan Hospital, Dehradun', phone: '0135-2471000', distance: '5.1 km' },
  { name: 'Government District Hospital', phone: '01344-222222', distance: '7.8 km' },
];

export default function SosOverlay({ caseId, onDismiss }) {
  const [countdown, setCountdown] = useState(30);
  const [dispatched, setDispatched] = useState(false);
  const [nearest] = useState(MOCK_HOSPITALS[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setDispatched(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
          <h1 className="text-4xl font-black tracking-tight">EMERGENCY</h1>
          <p className="text-red-200 text-lg mt-2">Critical symptoms detected. Emergency services alerted.</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 text-left space-y-3">
          <p className="flex items-center gap-2 font-semibold text-lg">
            <MapPin className="w-5 h-5 text-red-200" /> Nearest Hospital
          </p>
          <div>
            <p className="font-bold text-xl">{nearest.name}</p>
            <p className="text-red-200 text-sm">{nearest.distance} away</p>
          </div>
          <a
            href={`tel:${nearest.phone}`}
            className="flex items-center gap-3 bg-white text-red-700 font-bold rounded-xl px-5 py-3 hover:bg-red-50 transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call Hospital: {nearest.phone}
          </a>
        </div>

        <div className="bg-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Ambulance className="w-6 h-6 text-red-200 flex-shrink-0" />
            {dispatched ? (
              <div className="text-left">
                <p className="font-bold text-lg">Ambulance Dispatched ✓</p>
                <p className="text-red-200 text-sm">Estimated arrival: 8–12 minutes</p>
              </div>
            ) : (
              <div className="text-left">
                <p className="font-bold text-lg">Dispatching Ambulance…</p>
                <p className="text-red-200 text-sm">
                  Dispatch confirmed in{' '}
                  <span className="text-white font-black text-xl">{countdown}s</span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${((30 - countdown) / 30) * 100}%` }}
            />
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
