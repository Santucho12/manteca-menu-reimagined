import type { Metadata } from 'next';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
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
      <Seccion titulo="Sumar un tipo de venta">
        <FormularioDeCanal />
      </Seccion>
      <TarjetasDeCanales canales={canales} />
      <EnlaceDeVolver href="/admin/ventas">Volver a ventas</EnlaceDeVolver>
    </Pantalla>
  );
}
