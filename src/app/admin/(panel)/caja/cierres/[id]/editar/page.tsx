import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { cierrePorId } from '@/lib/caja/consultas';
import { datosParaEditar } from '@/lib/caja/paraEditar';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { FormularioDeCierre } from '../../../FormularioDeCierre';

export const metadata: Metadata = { title: 'Editar cierre' };

export default async function EditarCierre({ params }: { params: Promise<{ id: string }> }) {
  const { cliente, estado } = await exigirPagina('caja');
  // La base decide: Caja lee solo los suyos; uno ajeno o anulado no se edita.
  const cierre = await cierrePorId(cliente, (await params).id);
  if (!cierre || cierre.anulado) notFound();
  return (
    <Pantalla
      titulo={`Editar el cierre del ${fechaParaMostrar(cierre.fecha)}`}
      subtitulo="Corregí lo que haga falta: el resultado se vuelve a calcular con las ventas del día."
      ayuda={estado === 'admin' ? 'control' : 'caja'}
    >
      <FormularioDeCierre id={cierre.id} inicial={datosParaEditar(cierre)} />
    </Pantalla>
  );
}
