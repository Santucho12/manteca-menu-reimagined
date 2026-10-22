import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { cierrePorId, fondosAnteriores, type Cierre } from '@/lib/caja/consultas';
import { nombreDeEstado } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { anularCierreDesdeElPanel } from '../../acciones';
import { BotonDeRevisar } from './BotonDeRevisar';
import { DetalleDelCierre } from './DetalleDelCierre';

export const metadata: Metadata = { title: 'Cierre de caja' };

function Marcas({ cierre }: { cierre: Cierre }) {
  if (cierre.estado !== 'anulado' && !cierre.comentario_revision) return null;
  return (
    <FranjaDeAviso>
      {cierre.estado === 'anulado' ? <p>Anulado: {cierre.motivo_anulacion}</p> : null}
      {cierre.comentario_revision ? (
        <p>Comentario de la revisión: {cierre.comentario_revision}</p>
      ) : null}
    </FranjaDeAviso>
  );
}

function AccionesDelCierre({ cierre }: { cierre: Cierre }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {cierre.estado === 'revisado' ? null : <BotonDeRevisar id={cierre.id} />}
      <BotonDeAnular id={cierre.id} anular={anularCierreDesdeElPanel} titulo="Anular el cierre" />
    </div>
  );
}

export default async function FichaDeCierre({ params }: { params: Promise<{ id: string }> }) {
  const { cliente, estado } = await exigirPagina('caja');
  // RLS decide: Caja lee solo los suyos; uno ajeno no existe para ella.
  const cierre = await cierrePorId(cliente, (await params).id);
  if (!cierre) notFound();
  const esAdmin = estado === 'admin';
  // Solo el admin ve con que se compara el fondo: Caja no lee los cierres de los demas.
  const anterior = esAdmin
    ? ((await fondosAnteriores(cliente, [cierre.id])).get(cierre.id) ?? null)
    : null;
  return (
    <Pantalla
      titulo={`Cierre del ${fechaParaMostrar(cierre.fecha)}`}
      subtitulo={`Cargado por ${cierre.persona}`}
      ayuda={esAdmin ? 'control' : 'caja'}
    >
      <div>
        <InsigniaDeEstado tono={cierre.estado === 'anulado' ? 'pizarra' : 'esmeralda'}>
          {nombreDeEstado(cierre.estado)}
        </InsigniaDeEstado>
      </div>
      <Marcas cierre={cierre} />
      <DetalleDelCierre cierre={cierre} fondoAnterior={anterior} />
      {esAdmin && cierre.estado !== 'anulado' ? <AccionesDelCierre cierre={cierre} /> : null}
      <Link
        href={esAdmin ? '/admin/caja/control' : '/admin/caja/mis-cierres'}
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        {esAdmin ? 'Volver al control' : 'Volver a mis cierres'}
      </Link>
    </Pantalla>
  );
}
