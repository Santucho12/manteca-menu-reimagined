import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ACCESO_VERDE, ICONO_DE_ACCESO_SOBRE_VERDE } from '@/components/panel/estilos';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import {
  diasConCierre,
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
import { diaEnArgentina } from '@/lib/fechas';
import { montoParaEditar } from '@/lib/gastos/plata';
import type { Cliente } from '@/lib/supabase/cliente';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { TablaDeCierres } from '../TablaDeCierres';
import { AjustesDeCaja } from './AjustesDeCaja';
import { FiltrosDelControl, TurnosPendientes } from './PiezasDelControl';

export const metadata: Metadata = { title: 'Control de cierres' };

// Todo en una tanda: cada viaje a la base suma tiempo.
const leerElControl = (cliente: Cliente, filtros: FiltrosDeControl) =>
  Promise.all([
    listarCierres(cliente, filtros),
    personasDeCaja(cliente),
    toleranciaDeCaja(cliente),
    diasConCierre(cliente, filtros.desde, filtros.hasta),
    turnosPendientes(cliente, filtros.desde, filtros.hasta),
    diasSinAbrir(cliente, filtros.desde, filtros.hasta),
    horasDeCierreDelLocal(cliente),
  ]);

// Los días sin cierre no son de nadie: con una persona elegida no se muestran.
const sinPersona = (f: FiltrosDeControl, estado: string) =>
  !f.personaId && (f.estado === null || f.estado === estado);

const CargarCierre = () => (
  <Link href="/admin/caja" className={ACCESO_VERDE}>
    <span className={ICONO_DE_ACCESO_SOBRE_VERDE}>
      <Plus size={15} aria-hidden="true" />
    </span>
    Cargar cierre
  </Link>
);

export default async function ControlDeCierres({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeControl>;
}) {
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeControl(await searchParams, hoy);
  const { datos } = await exigirPaginaYLeer('admin', (c) => leerElControl(c, filtros));
  const [lista, personas, tolerancia, conCierre, faltan, sinAbrir, horas] = datos;
  const ultima = cantidadDePaginas(lista.total);
  const ajustes = { ...horas, tolerancia: montoParaEditar(tolerancia) };
  return (
    <Pantalla
      titulo="Control de cierres"
      subtitulo="Los cierres de cada turno, quién los cargó y si cierran."
      acciones={
        <>
          <CargarCierre />
          <AjustesDeCaja inicial={ajustes} />
        </>
      }
      ayuda="control"
    >
      <FiltrosDelControl filtros={filtros} personas={personas} />
      <TurnosPendientes
        turnos={sinPersona(filtros, 'pendiente') ? faltan : []}
        abierto={filtros.estado === 'pendiente'}
      />
      {filtros.estado === 'pendiente' ? null : (
        <TablaDeCierres
          admin
          filas={sinCierresCargados(filtros.estado) ? [] : lista.filas}
          total={lista.total}
          noAbrio={sinPersona(filtros, 'no_abrio') ? diasQueNoAbrio({ conCierre, sinAbrir }) : []}
          primera={lista.pagina === 1}
          ultima={lista.pagina >= ultima}
        />
      )}
      <Paginas
        pagina={lista.pagina}
        ultima={ultima}
        enlaceA={(pagina) => enlaceDeControl({ ...filtros, pagina }, hoy)}
      />
    </Pantalla>
  );
}
