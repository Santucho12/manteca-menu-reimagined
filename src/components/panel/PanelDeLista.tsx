import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  titulo: string;
  /** Lo que va en la pastilla al lado del título ("10 resultados"). */
  cantidad?: string;
  /** Lo que va a la derecha de la cabecera. */
  extra?: ReactNode;
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
}: Omit<Props, 'children'> & { id: string }) {
  const clases = cn(
    'px-4 md:px-6 py-4 md:py-5 flex flex-wrap items-center justify-between gap-3',
    acento === 'ambar' ? 'bg-amber-50' : 'bg-secondary/20',
    !desplegable && 'border-b border-border',
  );
  const contenido = (
    <>
      <div className="flex items-center gap-3">
        <h2
          id={id}
          className="text-sm md:text-base font-bold tracking-tight uppercase text-muted-foreground/80"
        >
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
          <span className="px-2 py-1 bg-secondary rounded-md text-[10px] md:text-xs font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
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
export function PanelDeLista({ titulo, cantidad, extra, acento, desplegable, children }: Props) {
  const id = `panel-${titulo.toLowerCase().replaceAll(' ', '-')}`;
  const cabecera = <Cabecera id={id} {...{ titulo, cantidad, extra, acento, desplegable }} />;
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'bg-card rounded-3xl md:rounded-[2rem] border shadow-xl overflow-hidden',
        acento === 'ambar' ? 'border-amber-300' : 'border-border/60',
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
