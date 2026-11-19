import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  History,
  PenLine,
  QrCode,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import type { MedioDeVenta as Medio } from '@/lib/caja/resultado';
import { nombreDeOrigen, type Origen } from '@/lib/ventas/pantalla';

const ICONOS_DE_MEDIO: Record<Medio, LucideIcon> = {
  efectivo: Banknote,
  credito: CreditCard,
  debito: CreditCard,
  qr: QrCode,
  transferencia: ArrowLeftRight,
  fuera_de_caja: Store,
};

const CHIP = 'inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap';

const ICONOS_DE_ORIGEN: Record<Origen, LucideIcon> = {
  mostrador: Store,
  manual: PenLine,
  fudo: History,
};

/** De donde viene la venta: un ícono y el nombre. */
export function OrigenDeVenta({ origen }: { origen: Origen }) {
  const Icono = ICONOS_DE_ORIGEN[origen];
  return (
    <span className={CHIP}>
      <Icono size={14} className="text-muted-foreground" aria-hidden="true" />
      {nombreDeOrigen(origen)}
    </span>
  );
}

/** Como se cobro, con el ícono de cada medio. */
export function MediosDePago({ medios }: { medios: Medio[] }) {
  if (medios.length === 0) return <span className="text-xs">—</span>;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {medios.map((medio) => {
        const Icono = ICONOS_DE_MEDIO[medio];
        return (
          <span key={medio} className={CHIP}>
            <Icono size={14} className="text-muted-foreground" aria-hidden="true" />
            {nombreDeMedio(medio)}
          </span>
        );
      })}
    </span>
  );
}
