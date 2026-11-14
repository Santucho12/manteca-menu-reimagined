import type { Metadata } from 'next';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FranjaDeAviso } from '@/components/panel/Avisos';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { cierreConFondoAnterior, type Cierre } from '@/lib/caja/consultas';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { anularCierreDesdeElPanel } from '../../acciones';
import { DetalleDelCierre } from './DetalleDelCierre';
import { ResumenDelCierre } from './ResumenDelCierre';

export const metadata: Metadata = { title: 'Cierre de caja' };

function Marcas({ cierre }: { cierre: Cierre }) {
  if (!cierre.anulado) return null;
  return (
    <FranjaDeAviso>
      <p>Anulado: {cierre.motivoDeAnulacion}</p>
    </FranjaDeAviso>
  );
}

// Solo el admin corrige o anula un cierre guardado: a Caja se le dice a quien avisarle.
function AccionesDelCierre({ cierre, esAdmin }: { cierre: Cierre; esAdmin: boolean }) {
  if (!esAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        ¿Algo está mal? Avisale a un administrador: lo corrige desde el control de cierres.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Link href={`/admin/caja/cierres/${cierre.id}/editar`} className={ACCESO_SECUNDARIO}>
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Pencil size={15} aria-hidden="true" />
        </span>
        Editar cierre
      </Link>
      <BotonDeAnular id={cierre.id} anular={anularCierreDesdeElPanel} titulo="Anular el cierre" />
    </div>
  );
}

export default async function FichaDeCierre({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // RLS decide: Caja lee solo los suyos; uno ajeno no existe para ella.
  const { estado, datos } = await exigirPaginaYLeer('caja', (cliente) =>
    cierreConFondoAnterior(cliente, id),
  );
  if (!datos) notFound();
  const { cierre } = datos;
  const esAdmin = estado === 'admin';
  // Solo el admin ve con que se compara el fondo: Caja no lee los cierres de los demas.
  const anterior = esAdmin ? datos.fondoAnteriorCentavos : null;
  return (
    <Pantalla
      titulo={`Cierre del ${fechaParaMostrar(cierre.fecha)}`}
      subtitulo={`Cargado por ${cierre.persona}`}
      ayuda={esAdmin ? 'control' : 'caja'}
    >
      <ResumenDelCierre cierre={cierre} />
      <Marcas cierre={cierre} />
      <DetalleDelCierre cierre={cierre} fondoAnterior={anterior} />
      {cierre.anulado ? null : <AccionesDelCierre cierre={cierre} esAdmin={esAdmin} />}
      <EnlaceDeVolver href={esAdmin ? '/admin/caja/control' : '/admin/caja/mis-cierres'}>
        {esAdmin ? 'Volver al control' : 'Volver a mis cierres'}
      </EnlaceDeVolver>
    </Pantalla>
  );
}
