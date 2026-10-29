import { Check } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ACCESO_SECUNDARIO } from '@/components/panel/estilos';

const GUARDAR =
  'group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-600 pl-4 pr-5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg active:translate-y-0 active:scale-[0.98] disabled:opacity-60';

type Props = { total: ReactNode; enviando: boolean };

/** El pie de la venta: el total bien a la vista y, al lado, cancelar y guardar. */
export function BarraDeGuardar({ total, enviando }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-white px-4 py-3 shadow-sm shadow-slate-900/5 md:px-6">
      {total}
      <div className="flex items-center gap-2.5">
        <Link href="/admin/ventas" className={`${ACCESO_SECUNDARIO} flex-none pl-5`}>
          Cancelar
        </Link>
        <button type="submit" disabled={enviando} className={GUARDAR}>
          <Check size={16} strokeWidth={2.8} aria-hidden="true" />
          {enviando ? 'Guardando...' : 'Guardar venta'}
        </button>
      </div>
    </div>
  );
}
