import type { Metadata } from 'next';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import {
  diasConCierre,
  fondosDelRango,
  listarCierres,
  personasDeCaja,
  toleranciaDeCaja,
} from '@/lib/caja/consultas';
import { horasDeCierreDelLocal, turnosPendientes } from '@/lib/caja/consultasDeTurnos';
import { diasQueNoAbrio } from '@/lib/caja/dias';
import {
  enlaceDeControl,
  filtrosDeControl,
  sinCierresCargados,
  type FiltrosDeControl,
  type ParametrosDeControl,
} from '@/lib/caja/pantalla';
import { diasSinAbrir } from '@/lib/caja/sinAbrir';
import type { HorasDeCierre } from '@/lib/caja/turnos';
import { diaEnArgentina } from '@/lib/fechas';
import { montoParaEditar } from '@/lib/gastos/plata';
import type { Cliente } from '@/lib/supabase/cliente';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { AccesoACargarCierre } from '../AccesoACargarCierre';
import { ListaDeCierres } from '../ListaDeCierres';
import { DiasQueNoAbrio } from './DiasQueNoAbrio';
import { DiasSinCierre, FiltrosDelControl } from './FiltrosDelControl';
import { HorasEnTuerca } from './HorasEnTuerca';
import { ToleranciaEnTuerca } from './ToleranciaEnTuerca';

export const metadata: Metadata = { title: 'Control de cierres' };

// Todo en una tanda: los fondos anteriores salen de los cierres del rango, no de la lista.
const leerElControl = (cliente: Cliente, filtros: FiltrosDeControl) =>
  Promise.all([
    listarCierres(cliente, filtros),
    personasDeCaja(cliente),
    toleranciaDeCaja(cliente),
    diasConCierre(cliente, filtros.desde, filtros.hasta),
    turnosPendientes(cliente, filtros.desde, filtros.hasta),
    fondosDelRango(cliente, filtros.desde, filtros.hasta),
    diasSinAbrir(cliente, filtros.desde, filtros.hasta),
    horasDeCierreDelLocal(cliente),
  ]);

async function datosDelControl(searchParams: Promise<ParametrosDeControl>) {
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeControl(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (cliente) => leerElControl(cliente, filtros));
  const [lista, personas, tolerancia, conCierre, faltan, fondos, sinAbrir, horas] = datos;
  const noAbrio = diasQueNoAbrio({ conCierre, sinAbrir });
  return { hoy, filtros, lista, personas, tolerancia, faltan, noAbrio, fondos, horas };
}

// Los dias sin cierre no son de nadie: con una persona elegida no se muestran.
const verPendientes = (f: FiltrosDeControl) =>
  !f.personaId && (f.estado === null || f.estado === 'pendiente');
const verNoAbrio = (f: FiltrosDeControl) =>
  !f.personaId && (f.estado === null || f.estado === 'no_abrio');

type PropsDeAcciones = { tolerancia: string; horas: HorasDeCierre };

const Acciones = ({ tolerancia, horas }: PropsDeAcciones) => (
  <>
    <AccesoACargarCierre />
    <HorasEnTuerca inicial={horas} />
    <ToleranciaEnTuerca inicial={tolerancia} />
  </>
);

export default async function ControlDeCierres({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeControl>;
}) {
  const { hoy, filtros, lista, personas, tolerancia, faltan, noAbrio, fondos, horas } =
    await datosDelControl(searchParams);
  return (
    <Pantalla
      titulo="Control de cierres"
      subtitulo="Los cierres de cada turno, quién los cargó y si cierran."
      acciones={<Acciones tolerancia={montoParaEditar(tolerancia)} horas={horas} />}
      ayuda="control"
    >
      <FiltrosDelControl filtros={filtros} personas={personas} />
      <DiasSinCierre
        turnos={verPendientes(filtros) ? faltan : []}
        abierto={filtros.estado === 'pendiente'}
      />
      <DiasQueNoAbrio
        dias={verNoAbrio(filtros) ? noAbrio : []}
        abierto={filtros.estado === 'no_abrio'}
      />
      {sinCierresCargados(filtros.estado) ? null : (
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
