import type { Metadata } from 'next';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import {
  diasConCierre,
  fondosDelRango,
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
import type { Cliente } from '@/lib/supabase/cliente';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { AccesoACargarCierre } from '../AccesoACargarCierre';
import { ListaDeCierres } from '../ListaDeCierres';
import { DiasSinCierre, FiltrosDelControl } from './FiltrosDelControl';
import { ToleranciaEnTuerca } from './ToleranciaEnTuerca';

export const metadata: Metadata = { title: 'Control de cierres' };

// Todo en una tanda: los fondos anteriores salen de los cierres del rango, no de la lista.
const leerElControl = (cliente: Cliente, filtros: FiltrosDeControl) =>
  Promise.all([
    listarCierres(cliente, filtros),
    personasDeCaja(cliente),
    toleranciaDeCaja(cliente),
    diasConCierre(cliente, filtros.desde, filtros.hasta),
    primerDiaConCierre(cliente),
    fondosDelRango(cliente, filtros.desde, filtros.hasta),
  ]);

async function datosDelControl(searchParams: Promise<ParametrosDeControl>) {
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeControl(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (cliente) => leerElControl(cliente, filtros));
  const [lista, personas, tolerancia, conCierre, primero, fondos] = datos;
  const { desde, hasta } = filtros;
  const faltan = diasSinCierre({ desde, hasta, conCierre, primero, hoy });
  return { hoy, filtros, lista, personas, tolerancia, faltan, fondos };
}

// Los dias pendientes no son de nadie: con una persona elegida no se muestran.
const verPendientes = (f: FiltrosDeControl) =>
  !f.personaId && (f.estado === null || f.estado === 'pendiente');

const Acciones = ({ tolerancia }: { tolerancia: string }) => (
  <>
    <AccesoACargarCierre />
    <ToleranciaEnTuerca inicial={tolerancia} />
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
