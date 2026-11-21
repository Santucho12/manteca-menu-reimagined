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
  /** El color del ícono y del foco: el de marca, o gris donde no va el dorado (Ventas). */
  tono?: 'marca' | 'gris';
};

// En el ingreso, la etiqueta queda para el lector: a la vista, el icono y el texto de ayuda.
const ETIQUETA_DE_INGRESO = 'sr-only';
const CAMPO_DE_INGRESO =
  'w-full h-11 rounded-xl border border-border bg-white/70 pl-11 pr-3 text-sm font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all outline-hidden';

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
  tono = 'marca',
  className,
  ...props
}: PropsDeCampo) {
  const gris = tono === 'gris';
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
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2',
              gris ? 'text-muted-foreground' : 'text-primary',
            )}
          />
        ) : null}
        <input
          {...props}
          id={id}
          className={cn(
            clasesDeCampo(variante),
            gris && 'focus:border-slate-400 focus:ring-slate-400/15',
            className,
          )}
          {...atributosDeError(id, error)}
        />
      </div>
      <ErrorDeCampo id={id} error={error} variante={variante} />
    </div>
  );
}
