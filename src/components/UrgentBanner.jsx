import React from 'react';
import { AlertTriangle } from 'lucide-react';

// Visually distinct urgency banner for anything resembling urgent symptoms.
export default function UrgentBanner({ title = 'This may need urgent attention', message = 'Contact your doctor or seek emergency care right away.' }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3.5 shadow-sm">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-600 text-white">
        <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-bold text-rose-800">{title}</p>
        <p className="mt-0.5 text-sm font-medium text-rose-700">{message}</p>
      </div>
    </div>
  );
}