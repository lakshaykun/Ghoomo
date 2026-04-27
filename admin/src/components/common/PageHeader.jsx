import React from 'react';

export default function PageHeader({ kicker, title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {kicker ? <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{kicker}</p> : null}
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h2>
        {description ? <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
        {children}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
