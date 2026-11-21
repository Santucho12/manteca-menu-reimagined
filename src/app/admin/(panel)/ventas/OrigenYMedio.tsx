import { ArrowLeftRight, Banknote, CreditCard, QrCode, Store, type LucideIcon } from 'lucide-react';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import type { MedioDeVenta as Medio } from '@/lib/caja/resultado';
import { colorDelMedio } from '@/lib/panel/coloresDelSistema';

const ICONOS_DE_MEDIO: Record<Medio, LucideIcon> = {
  efectivo: Banknote,
  credito: CreditCard,
  debito: CreditCard,
  qr: QrCode,
  transferencia: ArrowLeftRight,
  fuera_de_caja: Store,
};

// Cada medio con su color, el mismo de Vender (skill estetica-sistema: más color, 2026-11-21).
const CHIP =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap';

/** Como se cobro, con el ícono de cada medio. */
export function MediosDePago({ medios }: { medios: Medio[] }) {
  if (medios.length === 0) return <span className="text-xs">—</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {medios.map((medio) => {
        const Icono = ICONOS_DE_MEDIO[medio];
        return (
          <span key={medio} className={`${CHIP} ${colorDelMedio(medio)}`}>
            <Icono size={13} aria-hidden="true" />
            {nombreDeMedio(medio)}
          </span>
        );
      })}
    </span>
  );
}
