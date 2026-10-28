import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import {
  diasConCierre,
  fondosAnteriores,
  listarCierres,
  personasDeCaja,
  primerDiaConCierre,
  toleranciaDeCaja,
} from '@/lib/caja/consultas';
import { diasSinCierre } from '@/lib/caja/dias';
import {
  enlaceDeControl,
  filtrosDeControl,
  type FiltrosDeControl,
  type ParametrosDeControl,
} from '@/lib/caja/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { montoParaEditar } from '@/lib/gastos/plata';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeCierres } from '../ListaDeCierres';
import { DiasSinCierre, FiltrosDelControl } from './FiltrosDelControl';
import { ToleranciaEnTuerca } from './ToleranciaEnTuerca';

export const metadata: Metadata = { title: 'Control de cierres' };

async function datosDelControl(searchParams: Promise<ParametrosDeControl>) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeControl(await searchParams, hoy);
  const [lista, personas, tolerancia, conCierre, primero] = await Promise.all([
    listarCierres(cliente, filtros),
    personasDeCaja(cliente),
    toleranciaDeCaja(cliente),
    diasConCierre(cliente, filtros.desde, filtros.hasta),
    primerDiaConCierre(cliente),
  ]);
  const { desde, hasta } = filtros;
  const faltan = diasSinCierre({ desde, hasta, conCierre, primero, hoy });
  const fondos = await fondosAnteriores(
    cliente,
    lista.filas.map((fila) => fila.id),
  );
  return { hoy, filtros, lista, personas, tolerancia, faltan, fondos };
}

// Los dias pendientes no son de nadie: con una persona elegida no se muestran.
const verPendientes = (f: FiltrosDeControl) =>
  !f.personaId && (f.estado === null || f.estado === 'pendiente');

const Acciones = ({ tolerancia }: { tolerancia: string }) => (
  <>
    <ToleranciaEnTuerca inicial={tolerancia} />
    <Link href="/admin/caja" className={BOTON_DE_ENCABEZADO}>
      <Plus size={18} aria-hidden="true" /> Cargar cierre
    </Link>
  </>
);

export default async function ControlDeCierres({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeControl>;
}) {
  const { hoy, filtros, lista, personas, tolerancia, faltan, fondos } =
    await datosDelControl(searchParams);
  return (
    <Pantalla
      titulo="Control de cierres"
      subtitulo="Los cierres de cada día, quién los cargó y si cierran."
      acciones={<Acciones tolerancia={montoParaEditar(tolerancia)} />}
      ayuda="control"
    >
      <FiltrosDelControl filtros={filtros} personas={personas} hoy={hoy} />
      <DiasSinCierre
        dias={verPendientes(filtros) ? faltan : []}
        abierto={filtros.estado === 'pendiente'}
      />
      {filtros.estado === 'pendiente' ? null : (
        <ListaDeCierres filas={lista.filas} conPersona fondos={fondos} />
      )}
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeControl({ ...filtros, pagina }, hoy)}
      />
    </Pantalla>
  );
}
