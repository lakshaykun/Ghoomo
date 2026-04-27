import React from 'react';

export default function DataTable({ title, description, actions, children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {(title || description || actions) ? (
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
