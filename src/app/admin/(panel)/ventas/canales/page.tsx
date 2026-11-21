import type { Metadata } from 'next';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { canalesDeVenta } from '@/lib/ventas/consultas';
import { FormularioDeCanal } from './FormularioDeCanal';
import { TarjetasDeCanales } from './TarjetasDeCanales';

export const metadata: Metadata = { title: 'Tipos de venta' };

export default async function PaginaDeCanales() {
  const { datos: canales } = await exigirPaginaYLeer('admin', canalesDeVenta);
  return (
    <Pantalla
      titulo="Tipos de venta"
      subtitulo="Por dónde se vende: se elige en Vender al cobrar."
      ayuda="canales"
    >
      <section
        aria-label="Sumar un tipo de venta"
        className="rounded-2xl border border-border bg-white p-5 shadow-card md:p-6"
      >
        <div className="mb-4">
          <p className="font-display text-lg font-bold tracking-tight">Sumar un tipo de venta</p>
          <p className="text-sm text-muted-foreground">
            Escribí cómo se llama y aparece en Vender.
          </p>
        </div>
        <FormularioDeCanal />
      </section>
      <TarjetasDeCanales canales={canales} />
      <EnlaceDeVolver href="/admin/ventas">Volver a ventas</EnlaceDeVolver>
    </Pantalla>
  );
}
