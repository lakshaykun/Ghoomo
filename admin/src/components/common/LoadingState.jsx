import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ title = 'Loading', description, fullScreen = false }) {
  return (
    <div className={fullScreen ? 'flex min-h-screen items-center justify-center px-4' : 'flex items-center justify-center py-12'}>
      <div className="flex max-w-sm flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}
