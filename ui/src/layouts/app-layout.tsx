import Link from "next/link";
import type { ReactNode } from "react";
import { paths } from "@/routes/paths";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow">
        Pular para o conteúdo
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href={paths.opportunities} className="flex items-center gap-3 font-semibold tracking-tight text-slate-950">
            <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-amber-500 text-sm text-slate-950">N</span>
            <span>Nobre CRM</span>
          </Link>
          <nav aria-label="Navegação principal" className="flex items-center gap-1">
            <Link href={paths.opportunities} className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              Oportunidades
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
