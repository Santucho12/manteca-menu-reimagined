import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { cierrePorId } from '@/lib/caja/consultas';
import { datosParaEditar } from '@/lib/caja/paraEditar';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { FormularioDeCierre } from '../../../FormularioDeCierre';

export const metadata: Metadata = { title: 'Editar cierre' };

export default async function EditarCierre({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Solo el admin corrige un cierre guardado, y uno anulado no se edita.
  const { datos: cierre } = await exigirPaginaYLeer('admin', (cliente) => cierrePorId(cliente, id));
  if (!cierre || cierre.anulado) notFound();
  return (
    <Pantalla
      titulo={`Editar el cierre del ${fechaParaMostrar(cierre.fecha)}`}
      subtitulo="Corregí lo que haga falta: el resultado se vuelve a calcular con las ventas del día."
      ayuda="control"
    >
      <FormularioDeCierre
        id={cierre.id}
        inicial={datosParaEditar(cierre)}
        tipos={cierre.controles.map((c) => ({ canalId: c.canalId, nombre: c.tipo }))}
      />
    </Pantalla>
  );
}
