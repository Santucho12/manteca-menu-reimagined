import { ArrowLeftRight, Banknote, CreditCard, QrCode, type LucideIcon } from 'lucide-react';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { MEDIOS, type Medio } from '@/lib/caja/resultado';
import { tonoDeMedio } from '@/lib/vender/colores';
import { cn } from '@/lib/utils';

const ICONOS: Record<Medio, LucideIcon> = {
  efectivo: Banknote,
  debito: CreditCard,
  credito: CreditCard,
  qr: QrCode,
  transferencia: ArrowLeftRight,
};

type Props = {
  grupo: string;
  elegido: Medio | null;
  elegir: (medio: Medio) => void;
  /** Un medio que no se ofrece: el segundo no puede ser el primero. */
  sin?: Medio | null;
};

/** Los medios de pago como tarjetas grandes, cada uno con su color: se toca uno. */
export function ElegirMedio({ grupo, elegido, elegir, sin = null }: Props) {
  return (
    <div role="group" aria-label={grupo} className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {grupo}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MEDIOS.filter((medio) => medio !== sin).map((medio) => {
          const tono = tonoDeMedio(medio);
          const Icono = ICONOS[medio];
          const actual = medio === elegido;
          return (
            <button
              type="button"
              key={medio}
              aria-pressed={actual}
              onClick={() => elegir(medio)}
              className={cn(
                'flex min-h-20 items-center gap-3 rounded-2xl border-2 px-4 text-left text-sm font-bold transition-all active:scale-[0.98]',
                tono.suave,
                tono.texto,
                actual
                  ? 'border-foreground shadow-lg ring-4 ring-foreground/10'
                  : 'border-transparent',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white',
                  tono.solido,
                )}
              >
                <Icono size={18} aria-hidden="true" />
              </span>
              {nombreDeMedio(medio)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
