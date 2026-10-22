import { Repeat } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotonDeEstado } from '@/components/panel/BotonDeEstado';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { opcionesDeGasto, recurrentePorId } from '@/lib/gastos/consultas';
import { datosDeRecurrenteParaEditar } from '@/lib/gastos/esquemas';
import { cambiarEstadoDeRecurrenteDesdeElPanel } from '../../acciones-de-configuracion';
import { FormularioDeRecurrente } from '../FormularioDeRecurrente';

export const metadata: Metadata = { title: 'Gasto recurrente' };

export default async function FichaDeRecurrente({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const recurrente = await recurrentePorId(cliente, (await params).id);
  if (!recurrente) notFound();
  const opciones = await opcionesDeGasto(cliente);
  return (
    <Pantalla titulo="Gasto recurrente" subtitulo="Corregilo o desactivalo." ayuda="recurrentes">
      {recurrente.activo ? null : (
        <div>
          <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>
        </div>
      )}
      <Seccion icono={<Repeat className="text-primary" size={24} />}>
        <FormularioDeRecurrente
          inicial={datosDeRecurrenteParaEditar(recurrente)}
          id={recurrente.id}
          {...opciones}
        />
      </Seccion>
      <BotonDeEstado
        id={recurrente.id}
        activo={recurrente.activo}
        cambiar={cambiarEstadoDeRecurrenteDesdeElPanel}
      />
      <Link
        href="/admin/gastos/recurrentes"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a recurrentes
      </Link>
    </Pantalla>
  );
}
