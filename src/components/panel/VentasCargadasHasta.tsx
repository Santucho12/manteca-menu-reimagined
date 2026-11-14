import { CalendarClock } from 'lucide-react';
import { Suspense } from 'react';
import { diaEnArgentina } from '@/lib/fechas';
import { crearClienteDelServidor } from '@/lib/supabase/servidor';
import { textoDeCargadasHasta } from '@/lib/ventas/cargadasHasta';
import { ventasFudoCargadasHasta } from '@/lib/ventas/consultas';
import { cn } from '@/lib/utils';

async function Leido() {
  const fecha = await ventasFudoCargadasHasta(await crearClienteDelServidor());
  const { texto, atrasado } = textoDeCargadasHasta(fecha, diaEnArgentina(new Date()));
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 text-xs font-semibold',
        atrasado ? 'text-amber-700' : 'text-muted-foreground',
      )}
    >
      <CalendarClock size={14} aria-hidden="true" />
      {texto}
    </p>
  );
}

/**
 * Hasta que dia hay ventas de Fudo. Con el Excel llegan dias despues: sin esto, el balance de
 * un mes con los gastos al dia parece una perdida. Se lee aparte, sin frenar la pantalla.
 */
export function VentasCargadasHasta() {
  return (
    <Suspense fallback={null}>
      <Leido />
    </Suspense>
  );
}
