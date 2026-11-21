import { AlertTriangle, Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  titulo: string;
  /** Lo que va en la pastilla al lado del título ("10 resultados"). */
  cantidad?: string;
  /** Lo que va a la derecha de la cabecera. */
  extra?: ReactNode;
  /** El color de la pastilla del contador: verde para lo hecho, rojo para lo que falta. */
  contador?: 'verde' | 'rojo';
  /** Ámbar para lo que pide atención. */
  acento?: 'ambar';
  /** Un panel que se abre y se cierra: cerrado muestra solo la cabecera. */
  desplegable?: { abierto: boolean; tituloCerrado?: string };
  children: ReactNode;
};

function Cabecera({
  id,
  titulo,
  cantidad,
  extra,
  acento,
  desplegable,
  contador,
}: Omit<Props, 'children'> & { id: string }) {
  const clases = cn(
    'px-4 md:px-6 py-4 md:py-5 flex flex-wrap items-center justify-between gap-3',
    acento === 'ambar' ? 'bg-blue-50' : 'bg-white',
    !desplegable && 'border-b border-border',
  );
  const contenido = (
    <>
      <div className="flex items-center gap-3">
        <h2 id={id} className="font-display text-lg font-bold tracking-tight text-foreground">
          {desplegable?.tituloCerrado ? (
            <>
              <span className="group-open:hidden">{desplegable.tituloCerrado}</span>
              <span className="hidden group-open:inline">{titulo}</span>
            </>
          ) : (
            titulo
          )}
        </h2>
        {cantidad ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
              contador === 'verde' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
              contador === 'rojo' && 'border-rose-200 bg-rose-50 text-rose-600',
              !contador && 'border-border text-muted-foreground',
            )}
          >
            {contador === 'verde' ? <Check size={12} strokeWidth={3} aria-hidden="true" /> : null}
            {contador === 'rojo' ? <AlertTriangle size={12} aria-hidden="true" /> : null}
            {cantidad}
          </span>
        ) : null}
        {desplegable ? (
          <ChevronDown
            size={18}
            aria-hidden="true"
            className="text-muted-foreground transition-transform group-open:rotate-180"
          />
        ) : null}
      </div>
      {extra}
    </>
  );
  if (!desplegable) return <div className={clases}>{contenido}</div>;
  return (
    <summary className={cn(clases, 'cursor-pointer list-none [&::-webkit-details-marker]:hidden')}>
      {contenido}
    </summary>
  );
}

/** El panel de lista con cabecera de Plan Reminder Pro (MessagesView.tsx), como región con nombre. */
export function PanelDeLista({
  titulo,
  cantidad,
  extra,
  acento,
  desplegable,
  contador,
  children,
}: Props) {
  const id = `panel-${titulo.toLowerCase().replaceAll(' ', '-')}`;
  const cabecera = (
    <Cabecera id={id} {...{ titulo, cantidad, extra, acento, desplegable, contador }} />
  );
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-card',
        acento === 'ambar' ? 'border-blue-300' : 'border-border',
      )}
    >
      {desplegable ? (
        <details open={desplegable.abierto} className="group">
          {cabecera}
          <div className="border-t border-border">{children}</div>
        </details>
      ) : (
        <>
          {cabecera}
          {children}
        </>
      )}
    </section>
  );
}
