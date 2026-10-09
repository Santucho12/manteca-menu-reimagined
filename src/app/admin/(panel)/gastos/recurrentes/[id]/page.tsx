import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { exigirPagina } from '@/lib/acceso/servidor';
import { opcionesDeGasto, recurrentePorId } from '@/lib/gastos/consultas';
import { datosDeRecurrenteParaEditar } from '@/lib/gastos/esquemas';
import { cambiarEstadoDeRecurrenteDesdeElPanel } from '../../acciones-de-configuracion';
import { BotonDeEstado } from '../../BotonDeEstado';
import { FormularioDeRecurrente } from '../FormularioDeRecurrente';

export const metadata: Metadata = { title: 'Gasto recurrente' };

export default async function FichaDeRecurrente({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const recurrente = await recurrentePorId(cliente, (await params).id);
  if (!recurrente) notFound();
  const opciones = await opcionesDeGasto(cliente);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <TituloDePagina>Gasto recurrente</TituloDePagina>
        {recurrente.activo ? null : <Badge variant="outline">Desactivado</Badge>}
      </div>
      <FormularioDeRecurrente
        inicial={datosDeRecurrenteParaEditar(recurrente)}
        id={recurrente.id}
        {...opciones}
      />
      <BotonDeEstado
        id={recurrente.id}
        activo={recurrente.activo}
        cambiar={cambiarEstadoDeRecurrenteDesdeElPanel}
      />
      <Link
        href="/admin/gastos/recurrentes"
        className="inline-block py-2 text-sm underline underline-offset-4"
      >
        Volver a recurrentes
      </Link>
    </div>
  );
}
