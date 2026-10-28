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
  children: ReactNode;
};

/** El panel de lista con cabecera de Plan Reminder Pro (MessagesView.tsx), como región con nombre. */
export function PanelDeLista({ titulo, cantidad, extra, acento, children }: Props) {
  const id = `panel-${titulo.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'bg-card rounded-3xl md:rounded-[2rem] border shadow-xl overflow-hidden',
        acento === 'ambar' ? 'border-amber-300' : 'border-border/60',
      )}
    >
      <div
        className={cn(
          'px-4 md:px-6 py-4 md:py-5 border-b border-border flex flex-wrap items-center justify-between gap-3',
          acento === 'ambar' ? 'bg-amber-50' : 'bg-secondary/20',
        )}
      >
        <div className="flex items-center gap-3">
          <h2
            id={id}
            className="text-sm md:text-base font-bold tracking-tight uppercase text-muted-foreground/80"
          >
            {titulo}
          </h2>
          {cantidad ? (
            <span className="px-2 py-1 bg-secondary rounded-md text-[10px] md:text-xs font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">
              {cantidad}
            </span>
          ) : null}
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}
