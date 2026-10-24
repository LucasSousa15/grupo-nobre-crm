import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-nobre-forest">Pipeline comercial</p>
        <h1 className="text-3xl font-semibold tracking-tight text-nobre-forest-deep">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-nobre-ink-soft">{description}</p>
      </div>
      {action}
    </div>
  );
}
