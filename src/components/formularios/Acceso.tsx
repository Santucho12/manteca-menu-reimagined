import { Loader2, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type PropsDelTitulo = {
  inicio: string;
  resaltado: string;
  subtitulo: string;
};

/** El titulo de la tarjeta de ingreso, con la ultima palabra en el color de marca. */
export function TituloDeAcceso({ inicio, resaltado, subtitulo }: PropsDelTitulo) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">
        {inicio} <span className="text-primary">{resaltado}</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
    </div>
  );
}

/** El boton principal del ingreso: el azul de marca con letra blanca. */
export function BotonDeAcceso({ enviando, children }: { enviando: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      className="w-full h-11 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
    >
      {enviando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

type PropsDelSecundario = { href: string; texto: string; icono: LucideIcon };

/** El boton secundario de la tarjeta: lleva entre el ingreso y el registro. */
export function BotonSecundarioDeAcceso({ href, texto, icono: Icono }: PropsDelSecundario) {
  return (
    <Link
      href={href}
      className="mt-3 w-full h-11 rounded-full border border-primary/30 bg-primary/5 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary/50 transition-colors"
    >
      <Icono size={16} aria-hidden className="text-primary" />
      {texto}
    </Link>
  );
}
