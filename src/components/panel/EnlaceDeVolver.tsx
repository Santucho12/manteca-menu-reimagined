import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

const BOTON =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-transparent bg-secondary px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:border-border hover:bg-white hover:shadow-md active:scale-95';

/** El "Volver a ..." de las fichas: un enlace con la forma de un boton suave. */
export function EnlaceDeVolver({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={BOTON}>
      <ArrowLeft size={16} aria-hidden="true" />
      {children}
    </Link>
  );
}
