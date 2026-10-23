import type { ReactNode } from 'react';
import { ICONO_DE_TARJETA, TARJETA_DE_FORMULARIO, TARJETA_DE_SECCION } from './estilos';

type Props = {
  /** Sin titulo no hay barrita verde: la tarjeta va sola. */
  titulo?: string;
  icono?: ReactNode;
  /** 'lista' es la tarjeta de catalogos y listas; 'formulario', la de campos. */
  forma?: 'formulario' | 'lista';
  children: ReactNode;
};

/** El titulo con la barrita verde y la tarjeta de Plan Reminder Pro (Configuracion, Plataformas). */
export function Seccion({ titulo, icono, forma = 'formulario', children }: Props) {
  return (
    <section className="space-y-6">
      {titulo ? (
        <div className="flex items-center gap-3 px-1">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h2 className="text-xl font-bold tracking-tight text-slate-800">{titulo}</h2>
        </div>
      ) : null}
      <div className={forma === 'lista' ? TARJETA_DE_SECCION : TARJETA_DE_FORMULARIO}>
        {icono ? <div className={ICONO_DE_TARJETA}>{icono}</div> : null}
        {children}
      </div>
    </section>
  );
}

/** Una linea de datos en el mosaico de la ficha: etiqueta chica y valor. */
export function Dato({ titulo, valor }: { titulo: string; valor: ReactNode }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3">
      <dt className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        {titulo}
      </dt>
      <dd className="font-semibold break-words whitespace-pre-line">{valor ?? '—'}</dd>
    </div>
  );
}

/** Los datos de una ficha en mosaicos. */
export function Datos({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">{children}</dl>;
}
