import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ENLACE_EN_TEXTO, FranjaDeAviso } from '@/components/panel/Avisos';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import {
  BarraDeFiltros,
  BotonDeFiltrar,
  FiltroDeFecha,
  FiltroDeSeleccion,
} from '@/components/panel/Filtros';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { listarGastos, opcionesDeGasto, sinClasificar } from '@/lib/gastos/consultas';
import { generarAlAbrir } from '@/lib/gastos/generacion';
import {
  enlaceDeGastos,
  filtrosDeGastos,
  textoDeSinClasificar,
  type ParametrosDeGastos,
} from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeGastos } from './ListaDeGastos';

export const metadata: Metadata = { title: 'Gastos' };

const todas = (lista: { id: string; nombre: string }[], vacio: string) => [
  { valor: '', texto: vacio },
  ...lista.map((item) => ({ valor: item.id, texto: item.nombre })),
];

function Accesos() {
  return (
    <>
      <Link href="/admin/gastos/nuevo" className={BOTON_DE_ENCABEZADO}>
        <Plus size={18} aria-hidden="true" /> Cargar gasto
      </Link>
      <Link href="/admin/gastos/recurrentes" className={BOTON_DE_ENCABEZADO_NEUTRO}>
        Recurrentes
      </Link>
      <Link href="/admin/gastos/categorias" className={BOTON_DE_ENCABEZADO_NEUTRO}>
        Categorías
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
  const [lista, opciones, pendientes] = await Promise.all([
    listarGastos(cliente, filtros),
    opcionesDeGasto(cliente),
    sinClasificar(cliente),
  ]);
  const enlaceSinClasificar = `/admin/gastos?desde=2000-01-01&hasta=${filtros.hasta}&categoria=${pendientes.categoriaId}`;
  return (
    <Pantalla
      titulo="Gastos"
      subtitulo="Lo que se pagó, por categoría y proveedor."
      acciones={<Accesos />}
      ayuda="gastos"
    >
      {pendientes.cantidad > 0 && pendientes.categoriaId ? (
        <FranjaDeAviso>
          <Link href={enlaceSinClasificar} className={ENLACE_EN_TEXTO}>
            {textoDeSinClasificar(pendientes.cantidad)}
          </Link>
        </FranjaDeAviso>
      ) : null}
      <BarraDeFiltros accion="/admin/gastos">
        <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={filtros.desde} />
        <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={filtros.hasta} />
        <FiltroDeSeleccion
          id="categoria"
          name="categoria"
          etiqueta="Categoría"
          opciones={todas(opciones.categorias, 'Todas')}
          valor={filtros.categoriaId ?? ''}
        />
        <FiltroDeSeleccion
          id="proveedor"
          name="proveedor"
          etiqueta="Proveedor"
          opciones={todas(opciones.proveedores, 'Todos')}
          valor={filtros.proveedorId ?? ''}
        />
        <BotonDeFiltrar />
      </BarraDeFiltros>
      <p className="text-lg font-bold">Total: {formatearPesos(lista.totalCentavos)}</p>
      <ListaDeGastos filas={lista.filas} total={lista.total} />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeGastos({ ...filtros, pagina }, hoy)}
      />
    </Pantalla>
  );
}
