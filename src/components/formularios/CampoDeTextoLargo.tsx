import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { ETIQUETA } from '@/components/panel/estilos';
import { atributosDeError } from '@/lib/formularios/accesibilidad';
import { ErrorDeCampo } from './Campo';

type Props = ComponentProps<'textarea'> & { id: string; etiqueta: string; error?: string };

const AREA =
  'w-full min-h-[80px] rounded-xl bg-secondary/30 border-none p-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all resize-none';

export function CampoDeTextoLargo({ id, etiqueta, error, className, ...props }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      <textarea
        {...props}
        id={id}
        rows={3}
        {...atributosDeError(id, error)}
        className={cn(AREA, className)}
      />
      <ErrorDeCampo id={id} error={error} />
    </div>
  );
}
