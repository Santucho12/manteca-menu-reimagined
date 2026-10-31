import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ACCESO_VERDE, ICONO_DE_ACCESO_SOBRE_VERDE } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { listasAlDia } from '@/lib/gastos/alAbrir';
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
import {
  filtrosDeGastos,
  type FiltrosDeGastos,
  type ParametrosDeGastos,
} from '@/lib/gastos/pantalla';
import type { Cliente } from '@/lib/supabase/cliente';
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

const leerGastos = (cliente: Cliente, filtros: FiltrosDeGastos, hoy: string) =>
  Promise.all([
    listarGastos(cliente, filtros),
    opcionesDeGasto(cliente),
    listarRecurrentes(cliente),
    paraClasificar(cliente),
    listarCategorias(cliente),
    pagosPendientes(cliente),
    vencimientosTomados(cliente, hoy),
    resumenPorCategoria(cliente, filtros),
  ]);

async function datosDeGastos(parametros: ParametrosDeGastos, hoy: string) {
  const filtros = filtrosDeGastos(parametros, hoy);
  const leer = (cliente: Cliente) => leerGastos(cliente, filtros, hoy);
  const { cliente, estado, datos } = await exigirPaginaYLeer('admin', leer);
  // Lo vencido aparece al abrir, sin esperar al proceso de la madrugada.
  const generados = await generarAlAbrir(estado, hoy);
  return { filtros, listas: await listasAlDia(generados, datos, () => leer(cliente)) };
}

export default async function PaginaDeGastos({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeGastos>;
}) {
  const hoy = diaEnArgentina(new Date());
  const parametros = await searchParams;
  const pagar = unValor(parametros.pagar);
  const { filtros, listas } = await datosDeGastos(parametros, hoy);
  const [lista, opciones, recurrentes, pendientes, categorias, porPagar, tomados, resumen] = listas;
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
