import type { Metadata } from 'next';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotonDeAnular } from '@/components/panel/BotonDeAnular';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { cierreConFondoAnterior, type Cierre } from '@/lib/caja/consultas';
import { postergacionesDelCierre } from '@/lib/caja/consultasDeTurnos';
import { textoDePostergaciones } from '@/lib/caja/turnos';
import type { Cliente } from '@/lib/supabase/cliente';
import { anularCierreDesdeElPanel } from '../../acciones';
import { DatosDelCierre } from './DatosDelCierre';
import { MedioPorMedio, ResultadoDelCierre, TiposDelCierre } from './PartesDelCierre';

export const metadata: Metadata = { title: 'Cierre de caja' };

// El cierre y, con su fecha y su turno, cuántas veces se postergó.
async function leerElCierre(cliente: Cliente, id: string) {
  const datos = await cierreConFondoAnterior(cliente, id);
  if (!datos) return null;
  const postergaciones = await postergacionesDelCierre(
    cliente,
    datos.cierre.fecha,
    datos.cierre.turno,
  );
  return { ...datos, postergaciones: textoDePostergaciones(postergaciones) };
}

// Solo el admin corrige o anula un cierre guardado; a Caja se le dice a quién avisarle.
function Acciones({ cierre, admin }: { cierre: Cierre; admin: boolean }) {
  if (!admin) {
    return (
      <p className="text-sm text-muted-foreground">
        ¿Algo está mal? Avisale a un administrador: lo corrige desde el control de cierres.
      </p>
    );
  }
  if (cierre.anulado) return null;
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

export default async function DetalleDelCierre({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // RLS decide: Caja lee solo los suyos; uno ajeno no existe para ella.
  const { estado, datos } = await exigirPaginaYLeer('caja', (cliente) => leerElCierre(cliente, id));
  if (!datos) notFound();
  const admin = estado === 'admin';
  const { cierre } = datos;
  return (
    <Pantalla
      titulo="Cierre de caja"
      subtitulo="El resultado del turno, medio por medio."
      ayuda={admin ? 'control' : 'caja'}
    >
      <EnlaceDeVolver href={admin ? '/admin/caja/control' : '/admin/caja/mis-cierres'}>
        {admin ? 'Control de cierres' : 'Mis cierres'}
      </EnlaceDeVolver>
      <ResultadoDelCierre cierre={cierre} />
      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <MedioPorMedio cierre={cierre} />
          <TiposDelCierre cierre={cierre} />
        </div>
        <DatosDelCierre
          cierre={cierre}
          fondoAnteriorCentavos={datos.fondoAnteriorCentavos}
          postergaciones={datos.postergaciones}
        />
      </div>
      <Acciones cierre={cierre} admin={admin} />
    </Pantalla>
  );
}
