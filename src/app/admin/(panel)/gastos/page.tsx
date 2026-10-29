import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ACCESO_VERDE, ICONO_DE_ACCESO_SOBRE_VERDE } from '@/components/panel/estilos';
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
import { unValor } from '@/lib/usuarios/presentacion';
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
      <Link href="/admin/gastos/nuevo" className={ACCESO_VERDE}>
        <span className={ICONO_DE_ACCESO_SOBRE_VERDE}>
          <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
        </span>
        Cargar gasto
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
  const parametros = await searchParams;
  const filtros = filtrosDeGastos(parametros, hoy);
  const pagar = unValor(parametros.pagar);
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
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 md:gap-8 items-start">
        <div className="xl:col-span-3 order-2 xl:order-1 space-y-5">
          <TarjetasDeCategoria resumen={resumen} filtros={filtros} hoy={hoy} />
          <Pagados lista={lista} filtros={filtros} hoy={hoy} categorias={opciones.categorias} />
        </div>
        <div className="order-1 xl:order-2 xl:col-span-2">
          <ProximosPagos
            recurrentes={recurrentes}
            porPagar={porPagar}
            tomados={tomados}
            hoy={hoy}
            pagar={pagar}
          />
        </div>
      </div>
    </Pantalla>
  );
}
