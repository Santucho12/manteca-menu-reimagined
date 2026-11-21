'use client';

import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  QrCode,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { FieldErrors } from 'react-hook-form';
import { Campo } from '@/components/formularios/Campo';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import type { Registro } from '@/lib/formularios/valorInicial';
import { Bloque } from './Piezas';

type Medio = 'efectivo' | 'credito' | 'debito' | 'qr' | 'transferencia';

const MEDIOS: { medio: Medio; etiqueta: string; Icono: LucideIcon }[] = [
  { medio: 'efectivo', etiqueta: 'Efectivo', Icono: Banknote },
  { medio: 'credito', etiqueta: 'Tarjeta de crédito', Icono: CreditCard },
  { medio: 'debito', etiqueta: 'Tarjeta de débito', Icono: CreditCard },
  { medio: 'qr', etiqueta: 'QR', Icono: QrCode },
  { medio: 'transferencia', etiqueta: 'Transferencia', Icono: ArrowLeftRight },
];

type Props = {
  registro: Registro<DatosDeCierre>;
  errors: FieldErrors<DatosDeCierre>;
  avisoDelFondo?: string | null;
};

/** El fondo con que arrancó y lo que hay ahora en la caja, medio por medio. */
export function MediosDeLaCaja({ registro, errors, avisoDelFondo }: Props) {
  return (
    <Bloque
      titulo="Lo que hay en la caja"
      ayuda="Contá cada medio. Si un medio no tuvo ventas, dejalo vacío."
      icono={Wallet}
      tono="violeta"
    >
      <div className="rounded-xl bg-secondary/40 p-4">
        <Campo
          id="fondoInicial"
          etiqueta="Fondo inicial"
          inputMode="decimal"
          error={errors.fondoInicial?.message}
          {...registro('fondoInicial')}
        />
        {avisoDelFondo ? (
          <p className="mt-2 text-xs font-medium text-muted-foreground">{avisoDelFondo}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MEDIOS.map(({ medio, etiqueta, Icono }) => (
          <div key={medio} className="flex items-end gap-3">
            <span className="mb-1.5 grid size-9 shrink-0 place-items-center rounded-lg border border-violet-100 bg-violet-50 text-violet-600">
              <Icono size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <Campo
                id={medio}
                etiqueta={etiqueta}
                inputMode="decimal"
                error={errors[medio]?.message}
                {...registro(medio)}
              />
            </div>
          </div>
        ))}
      </div>
    </Bloque>
  );
}
