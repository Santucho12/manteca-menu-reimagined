import { cn } from '@/lib/utils';

const FORMAS = {
  // El error del formulario, escrito arriba de los botones.
  texto: 'text-sm text-rose-600 font-medium',
  // El del ingreso: la caja rosada de la tarjeta de Plan Reminder Pro.
  caja: 'text-sm text-destructive bg-status-overdue p-2 rounded-md',
} as const;

type Props = { mensaje: string; variante?: keyof typeof FORMAS; className?: string };

/** Por que no se pudo, dicho para una persona. Va dentro de main: ahi lo buscan las pruebas. */
export function AvisoDeError({ mensaje, variante = 'texto', className }: Props) {
  return (
    <p role="alert" className={cn(FORMAS[variante], className)}>
      {mensaje}
    </p>
  );
}
