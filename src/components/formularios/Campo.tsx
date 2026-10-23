import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { CAMPO, ETIQUETA } from '@/components/panel/estilos';
import { atributosDeError, idDelError } from '@/lib/formularios/accesibilidad';
import { cn } from '@/lib/utils';

export type VarianteDeCampo = 'panel' | 'ingreso';

export type PropsDeCampo = ComponentProps<'input'> & {
  id: string;
  etiqueta: string;
  error?: string;
  icono?: LucideIcon;
  variante?: VarianteDeCampo;
};

// En el ingreso, los campos de la tarjeta de Plan Reminder Pro: etiqueta despegada e icono adelante.
const ETIQUETA_DE_INGRESO =
  'text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1';
const CAMPO_DE_INGRESO =
  'w-full h-12 rounded-xl border-none bg-secondary/30 pl-10 pr-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all outline-hidden';

export const clasesDeEtiqueta = (variante: VarianteDeCampo) =>
  variante === 'ingreso' ? ETIQUETA_DE_INGRESO : ETIQUETA;
export const clasesDeCampo = (variante: VarianteDeCampo) =>
  variante === 'ingreso' ? CAMPO_DE_INGRESO : CAMPO;

/** El mensaje de error debajo de un campo, el que el lector de pantalla lee como su descripcion. */
export function ErrorDeCampo({
  id,
  error,
  variante = 'panel',
}: Pick<PropsDeCampo, 'id' | 'error' | 'variante'>) {
  if (!error) return null;
  return (
    <p
      id={idDelError(id)}
      className={cn('text-xs text-rose-600 font-medium', variante === 'ingreso' && 'mt-2 px-1')}
    >
      {error}
    </p>
  );
}

/** Un campo con su etiqueta y, si hace falta, su error. */
export function Campo({
  id,
  etiqueta,
  error,
  icono: Icono,
  variante = 'panel',
  className,
  ...props
}: PropsDeCampo) {
  return (
    <div className={variante === 'panel' ? 'space-y-2' : undefined}>
      <label htmlFor={id} className={clasesDeEtiqueta(variante)}>
        {etiqueta}
      </label>
      <div className="relative">
        {Icono ? (
          <Icono
            size={16}
            strokeWidth={2}
            aria-hidden
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
          />
        ) : null}
        <input
          {...props}
          id={id}
          className={cn(clasesDeCampo(variante), className)}
          {...atributosDeError(id, error)}
        />
      </div>
      <ErrorDeCampo id={id} error={error} variante={variante} />
    </div>
  );
}
