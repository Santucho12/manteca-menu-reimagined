import { cn } from '@/lib/utils';

type Props = { activo: boolean; etiqueta: string; deshabilitado?: boolean; alCambiar: () => void };

/** El interruptor de prendido y apagado: azul marino prendido, gris apagado. */
export function Interruptor({ activo, etiqueta, deshabilitado = false, alCambiar }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={alCambiar}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50',
        activo ? 'bg-emerald-500' : 'bg-slate-300',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200',
          activo && 'translate-x-5',
        )}
      />
    </button>
  );
}
