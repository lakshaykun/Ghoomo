import React from 'react';

const TONES = {
  blue: {
    border: 'border-blue-200',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    label: 'text-slate-500',
  },
  green: {
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    label: 'text-slate-500',
  },
  amber: {
    border: 'border-amber-200',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    label: 'text-slate-500',
  },
  red: {
    border: 'border-rose-200',
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600',
    label: 'text-slate-500',
  },
  slate: {
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    label: 'text-slate-500',
  },
};

export default function StatCard({ title, value, icon: Icon, tone = 'blue', detail }) {
  const currentTone = TONES[tone] || TONES.slate;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${currentTone.border}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${currentTone.label}`}>{title}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-900">{value}</p>
          {detail ? <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p> : null}
        </div>
        {Icon ? (
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${currentTone.iconBg}`}>
            <Icon className={`h-5 w-5 ${currentTone.iconText}`} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
