import Link from 'next/link';
import type { ReactNode } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { paths } from '@/routes/paths';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:cursor-pointer focus:rounded-md focus:bg-nobre-forest focus:px-3 focus:py-2 focus:text-sm focus:text-white focus:shadow">Pular para o conteúdo</a>
      <div className="bg-nobre-pitch px-5 py-2 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-nobre-crown sm:px-8">Nobre Brindes · CRM comercial</div>
      <header className="border-b border-nobre-forest-deep/15 bg-nobre-sprout">
        <div className="mx-auto flex max-w-[1800px] justify-center px-4 py-4 lg:px-6">
          <Link href={paths.opportunities} aria-label="Ir para a página inicial" className="flex cursor-pointer items-center gap-3 font-semibold tracking-tight text-nobre-forest-deep transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-nobre-forest focus:ring-offset-2">
            <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-nobre-forest-deep text-nobre-crown"><LayoutDashboard size={17} strokeWidth={2.4} /></span>
            <span>Nobre CRM</span>
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1800px] px-4 py-8 lg:px-6">{children}</main>
    </div>
  );
}
