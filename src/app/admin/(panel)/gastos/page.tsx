import type { Metadata } from 'next';
import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { listarGastos, opcionesDeGasto, sinClasificar, type Opcion } from '@/lib/gastos/consultas';
import { generarAlAbrir } from '@/lib/gastos/generacion';
import {
  enlaceDeGastos,
  filtrosDeGastos,
  type FiltrosDeGastos,
  type ParametrosDeGastos,
  textoDeSinClasificar,
} from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeGastos } from './ListaDeGastos';

export const metadata: Metadata = { title: 'Gastos' };

type PropsDeFiltros = { filtros: FiltrosDeGastos; categorias: Opcion[]; proveedores: Opcion[] };

const todas = (lista: Opcion[], vacio: string) => [
  { valor: '', texto: vacio },
  ...lista.map((item) => ({ valor: item.id, texto: item.nombre })),
];

function Filtros({ filtros, categorias, proveedores }: PropsDeFiltros) {
  return (
    <form action="/admin/gastos" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <Campo id="desde" name="desde" type="date" etiqueta="Desde" defaultValue={filtros.desde} />
      <Campo id="hasta" name="hasta" type="date" etiqueta="Hasta" defaultValue={filtros.hasta} />
      <CampoDeSeleccion
        id="categoria"
        name="categoria"
        etiqueta="Categoría"
        opciones={todas(categorias, 'Todas')}
        defaultValue={filtros.categoriaId ?? ''}
      />
      <CampoDeSeleccion
        id="proveedor"
        name="proveedor"
        etiqueta="Proveedor"
        opciones={todas(proveedores, 'Todos')}
        defaultValue={filtros.proveedorId ?? ''}
      />
      <Button type="submit">Filtrar</Button>
    </form>
  );
}

function Paginas({
  filtros,
  total,
  hoy,
}: {
  filtros: FiltrosDeGastos;
  total: number;
  hoy: string;
}) {
  const ultima = cantidadDePaginas(total);
  if (ultima === 1) return null;
  const a = (pagina: number) => enlaceDeGastos({ ...filtros, pagina }, hoy);
  return (
    <nav aria-label="Páginas" className="flex items-center gap-4 text-sm">
      {filtros.pagina > 1 ? <Link href={a(filtros.pagina - 1)}>Anterior</Link> : null}
      <span>
        Página {filtros.pagina} de {ultima}
      </span>
      {filtros.pagina < ultima ? <Link href={a(filtros.pagina + 1)}>Siguiente</Link> : null}
    </nav>
  );
}

type Pendientes = { cantidad: number; categoriaId: string | null; hasta: string };

// Los gastos que Caja pago con la caja esperan su categoria: el enlace los muestra todos.
function SinClasificar({ cantidad, categoriaId, hasta }: Pendientes) {
  if (cantidad === 0 || !categoriaId) return null;
  const enlace = '/admin/gastos?desde=2000-01-01&hasta=' + hasta + '&categoria=' + categoriaId;
  return (
    <p>
      <Link href={enlace} className="font-medium underline underline-offset-4">
        {textoDeSinClasificar(cantidad)}
      </Link>
    </p>
  );
}

function Accesos() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <Link href="/admin/gastos/nuevo">Cargar gasto</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/admin/gastos/recurrentes">Recurrentes</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/admin/gastos/categorias">Categorías</Link>
      </Button>
    </div>
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
  return (
    <div className="space-y-6">
      <TituloDePagina subtitulo="Lo que se pagó, por categoría y proveedor.">Gastos</TituloDePagina>
      <Accesos />
      <SinClasificar {...pendientes} hasta={filtros.hasta} />
      <Filtros filtros={filtros} {...opciones} />
      <p className="text-lg font-semibold">Total: {formatearPesos(lista.totalCentavos)}</p>
      <ListaDeGastos filas={lista.filas} />
      <Paginas filtros={{ ...filtros, pagina: lista.pagina }} total={lista.total} hoy={hoy} />
    </div>
  );
}
