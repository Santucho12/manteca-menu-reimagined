import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
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
import { enlaceDeControl, filtrosDeControl, type ParametrosDeControl } from '@/lib/caja/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { montoParaEditar } from '@/lib/gastos/plata';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeCierres } from '../ListaDeCierres';
import { DiasSinCierre, FiltrosDelControl } from './FiltrosDelControl';
import { FormularioDeTolerancia } from './FormularioDeTolerancia';

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

const Acceso = () => (
  <Link href="/admin/caja" className={BOTON_DE_ENCABEZADO}>
    <Plus size={18} aria-hidden="true" /> Cargar cierre
  </Link>
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
      acciones={<Acceso />}
      ayuda="control"
    >
      <Seccion titulo="Tolerancia">
        <FormularioDeTolerancia inicial={montoParaEditar(tolerancia)} />
      </Seccion>
      <FiltrosDelControl filtros={filtros} personas={personas} />
      <DiasSinCierre dias={filtros.estado || filtros.personaId ? [] : faltan} />
      <ListaDeCierres filas={lista.filas} conPersona fondos={fondos} />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeControl({ ...filtros, pagina }, hoy)}
      />
    </Pantalla>
  );
}
