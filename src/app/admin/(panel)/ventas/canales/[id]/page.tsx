import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BotonDeEstado } from '@/components/panel/BotonDeEstado';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { canalesDeVenta } from '@/lib/ventas/consultas';
import { cambiarEstadoDeCanalDesdeElPanel } from '../../acciones';
import { FormularioDeCanal } from '../FormularioDeCanal';

export const metadata: Metadata = { title: 'Tipo de venta' };

export default async function FichaDeCanal({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const { id } = await params;
  // Son pocos: se buscan en la lista.
  const canal = (await canalesDeVenta(cliente)).find((c) => c.id === id);
  if (!canal) notFound();
  return (
    <Pantalla titulo={canal.nombre} subtitulo="Renombralo o desactivalo." ayuda="canales">
      {canal.activo ? null : (
        <div>
          <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>
        </div>
      )}
      <Seccion>
        <FormularioDeCanal id={canal.id} inicial={canal.nombre} />
      </Seccion>
      <p className="text-xs text-muted-foreground max-w-xl">
        Desactivarlo no cambia las ventas que ya lo usan: solo deja de ofrecerse al cargar.
      </p>
      <BotonDeEstado
        id={canal.id}
        activo={canal.activo}
        cambiar={cambiarEstadoDeCanalDesdeElPanel}
      />
      <EnlaceDeVolver href="/admin/ventas/canales">Volver a tipos de venta</EnlaceDeVolver>
    </Pantalla>
  );
}
