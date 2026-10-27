const LUGARES = {
  // El contador de las pestañas de Plan Reminder Pro, empujado a la derecha.
  lateral:
    'relative z-10 ml-auto px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black',
  // Sobre el icono: el numero queda antes del nombre ("3 Gastos"), como esperan las pruebas.
  abajo:
    'absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-black leading-4 text-center ring-2 ring-card',
};

type Props = { numero: number | null; lugar: keyof typeof LUGARES };

/** Lo que espera en una seccion (extension: Plan Reminder Pro no tiene). Sin pendientes, nada. */
export function Insignia({ numero, lugar }: Props) {
  if (!numero) return null;
  return <span className={LUGARES[lugar]}>{numero}</span>;
}
