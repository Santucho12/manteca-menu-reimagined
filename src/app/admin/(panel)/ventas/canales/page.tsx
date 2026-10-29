import type { Metadata } from 'next';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { canalesDeVenta } from '@/lib/ventas/consultas';
import { FormularioDeCanal } from './FormularioDeCanal';
import { TarjetasDeCanales } from './TarjetasDeCanales';

export const metadata: Metadata = { title: 'Tipos de venta' };

export default async function PaginaDeCanales() {
  const { cliente } = await exigirPagina('admin');
  const canales = await canalesDeVenta(cliente);
  return (
    <Pantalla
      titulo="Tipos de venta"
      subtitulo="Por dónde entran las ventas que no pasan por Fudo."
      ayuda="canales"
    >
      <section
        aria-label="Sumar un tipo de venta"
        className="rounded-3xl border border-border bg-white p-5 shadow-sm shadow-slate-900/5 md:p-6"
      >
        <div className="mb-4">
          <p className="font-display text-lg font-bold tracking-tight">Sumar un tipo de venta</p>
          <p className="text-sm text-muted-foreground">
            Escribí cómo se llama y aparece al cargar una venta a mano.
          </p>
        </div>
        <FormularioDeCanal />
      </section>
      <TarjetasDeCanales canales={canales} />
      <EnlaceDeVolver href="/admin/ventas">Volver a ventas</EnlaceDeVolver>
    </Pantalla>
  );
}
