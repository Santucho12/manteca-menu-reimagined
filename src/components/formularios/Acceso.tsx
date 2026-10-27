import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** El titulo de la tarjeta de ingreso: el h1 de esas pantallas. */
export function TituloDeAcceso({ children }: { children: ReactNode }) {
  return <h1 className="text-xl font-bold tracking-tight text-slate-800 mb-8 px-1">{children}</h1>;
}

/** El boton grande del ingreso de Plan Reminder Pro. */
export function BotonDeAcceso({ enviando, children }: { enviando: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
    >
      {enviando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

type Props = { pregunta: string; href: string; texto: string };

/** El enlace entre ingreso y registro (extension: Plan Reminder Pro no tiene registro). */
export function EnlaceDeAcceso({ pregunta, href, texto }: Props) {
  return (
    <p className="mt-6 px-1 text-xs font-semibold text-muted-foreground">
      {pregunta}{' '}
      <Link href={href} className="text-primary hover:underline underline-offset-4">
        {texto}
      </Link>
    </p>
  );
}
