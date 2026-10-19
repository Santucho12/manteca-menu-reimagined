import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

// Las piezas del cuerpo de las pantallas, con la estetica de Plan Reminder Pro (skill
// estetica-panel). El dorado va en fondos, bordes e iconos: como letra sobre crema no se lee.

type PropsDePanel = {
  etiqueta?: ReactNode;
  extra?: ReactNode;
  titulo?: string;
  etiquetadoPor?: string;
  className?: string;
  children: ReactNode;
};

export function Panel({
  etiqueta,
  extra,
  titulo,
  etiquetadoPor,
  className,
  children,
}: PropsDePanel) {
  return (
    <section
      aria-label={titulo}
      aria-labelledby={etiquetadoPor}
      className={`bg-card overflow-hidden rounded-3xl border ${className ?? ''}`}
    >
      {etiqueta ? (
        <div className="flex items-center justify-between gap-3 border-b px-6 py-5">
          {etiqueta}
          {extra}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type PropsDeEtiqueta = { children: ReactNode; as?: 'span' | 'h2' | 'dt'; id?: string };

export function Etiqueta({ children, as: Elemento = 'span', id }: PropsDeEtiqueta) {
  return (
    <Elemento
      id={id}
      className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase"
    >
      {children}
    </Elemento>
  );
}

const TONOS = { neutro: 'bg-secondary', marca: 'bg-accent/10 ring-accent/40 ring-1' };

export function Pildora({
  children,
  tono = 'neutro',
}: {
  children: ReactNode;
  tono?: keyof typeof TONOS;
}) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wider ${TONOS[tono]}`}>
      {children}
    </span>
  );
}

export function IconoEnCuadrado({ icono: Icono, grande }: { icono: LucideIcon; grande?: boolean }) {
  const tamano = grande ? 'size-13 rounded-2xl' : 'size-10 rounded-xl';
  return (
    <span className={`bg-accent/15 grid shrink-0 place-items-center ${tamano}`}>
      <Icono size={20} aria-hidden="true" />
    </span>
  );
}

export function AccionesDelHero({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row">{children}</div>;
}

type PropsDeBoton = { href: string; children: ReactNode; principal?: boolean };

export function BotonDelHero({ href, children, principal }: PropsDeBoton) {
  const tono = principal
    ? 'bg-accent text-foreground shadow-accent/30 shadow-lg'
    : 'bg-card border';
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold tracking-[0.12em] uppercase transition-opacity hover:opacity-90 ${tono}`}
    >
      {children}
    </Link>
  );
}
