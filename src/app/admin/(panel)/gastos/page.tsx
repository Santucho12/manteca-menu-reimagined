import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import {
  listarCategorias,
  listarGastos,
  listarRecurrentes,
  opcionesDeGasto,
  paraClasificar,
  type FilaDeCategoria,
} from '@/lib/gastos/consultas';
import { generarAlAbrir } from '@/lib/gastos/generacion';
import { pagosPendientes, vencimientosTomados } from '@/lib/gastos/pagos';
import { resumenPorCategoria } from '@/lib/gastos/resumenPorCategoria';
import { filtrosDeGastos, type ParametrosDeGastos } from '@/lib/gastos/pantalla';
import { Pagados } from './Pagados';
import { ParaClasificar } from './ParaClasificar';
import { ProximosPagos } from './ProximosPagos';
import { TarjetasDeCategoria } from './TarjetasDeCategoria';
import { VentanaDeCategorias } from './VentanaDeCategorias';

export const metadata: Metadata = { title: 'Gastos' };

function Accesos({ categorias }: { categorias: FilaDeCategoria[] }) {
  return (
    <>
      <VentanaDeCategorias categorias={categorias} />
      <Link href="/admin/gastos/nuevo" className={BOTON_DE_ENCABEZADO}>
        <Plus aria-hidden="true" /> Cargar gasto
      </Link>
    </>
  );
}

export default async function PaginaDeGastos({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeGastos>;
}) {
  const { cliente, estado } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  // Lo vencido aparece al abrir, sin esperar al proceso de la madrugada.
  await generarAlAbrir(estado, hoy);
  const filtros = filtrosDeGastos(await searchParams, hoy);
  const [lista, opciones, recurrentes, pendientes, categorias, porPagar, tomados, resumen] =
    await Promise.all([
      listarGastos(cliente, filtros),
      opcionesDeGasto(cliente),
      listarRecurrentes(cliente),
      paraClasificar(cliente),
      listarCategorias(cliente),
      pagosPendientes(cliente),
      vencimientosTomados(cliente, hoy),
      resumenPorCategoria(cliente, filtros),
    ]);
  return (
    <Pantalla
      titulo="Gastos"
      subtitulo="Lo que pagaste y lo que viene."
      acciones={<Accesos categorias={categorias} />}
      ayuda="gastos"
    >
      <ParaClasificar gastos={pendientes.gastos} {...opciones} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-8 items-start">
        <div className="xl:col-span-2 order-2 xl:order-1 space-y-5">
          <TarjetasDeCategoria resumen={resumen} filtros={filtros} hoy={hoy} />
          <Pagados lista={lista} filtros={filtros} hoy={hoy} categorias={opciones.categorias} />
        </div>
        <div className="order-1 xl:order-2">
          <ProximosPagos
            recurrentes={recurrentes}
            porPagar={porPagar}
            tomados={tomados}
            hoy={hoy}
          />
        </div>
      </div>
    </Pantalla>
  );
}
