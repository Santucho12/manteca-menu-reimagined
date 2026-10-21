import { Info, Plus, Receipt, Store } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { BotonDelHero, Etiqueta, Panel } from '@/components/panel/Piezas';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { MEDIOS } from '@/lib/caja/resultado';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { listarVentas } from '@/lib/ventas/consultas';
import {
  enlaceDeVentas,
  filtrosDeVentas,
  lineasDelResumen,
  nombreDeOrigen,
  ORIGENES,
  type FiltrosDeVentas,
  type ParametrosDeVentas,
} from '@/lib/ventas/pantalla';
import { ListaDeVentas } from './ListaDeVentas';

export const metadata: Metadata = { title: 'Ventas' };

const todas = (texto: string) => ({ valor: '', texto });
const ESTADOS = [
  { valor: 'cerrada', texto: 'Cerradas' },
  { valor: 'cancelada', texto: 'Canceladas' },
  { valor: 'anulada', texto: 'Anuladas' },
];

function Filtros({ filtros }: { filtros: FiltrosDeVentas }) {
  return (
    <Panel
      titulo="Filtrar"
      className="lg:col-span-5"
      etiqueta={<Etiqueta as="h2">Filtrar</Etiqueta>}
    >
      <form action="/admin/ventas" className="grid gap-3 p-6 sm:grid-cols-2">
        <Campo id="desde" name="desde" type="date" etiqueta="Desde" defaultValue={filtros.desde} />
        <Campo id="hasta" name="hasta" type="date" etiqueta="Hasta" defaultValue={filtros.hasta} />
        <CampoDeSeleccion
          id="origen"
          name="origen"
          etiqueta="Origen"
          opciones={[
            todas('Todos'),
            ...ORIGENES.map((o) => ({ valor: o, texto: nombreDeOrigen(o) })),
          ]}
          defaultValue={filtros.origen ?? ''}
        />
        <CampoDeSeleccion
          id="medio"
          name="medio"
          etiqueta="Medio de pago"
          opciones={[todas('Todos'), ...MEDIOS.map((m) => ({ valor: m, texto: nombreDeMedio(m) }))]}
          defaultValue={filtros.medio ?? ''}
        />
        <CampoDeSeleccion
          id="estado"
          name="estado"
          etiqueta="Estado"
          opciones={[todas('Todos'), ...ESTADOS]}
          defaultValue={filtros.estado ?? ''}
        />
        <Button type="submit" className="self-end rounded-2xl">
          Filtrar
        </Button>
      </form>
    </Panel>
  );
}

// El mismo bloque marron de Inicio: la primera linea es el total de lo que se ve; la segunda, si
// la hay, lo cancelado aparte.
function TotalDelPeriodo({ lineas }: { lineas: string[] }) {
  const [principal, ...resto] = lineas;
  return (
    <section
      aria-label="Total del período"
      className="bg-foreground shadow-foreground/25 flex flex-col justify-center gap-4 rounded-[28px] p-7 text-white shadow-xl md:p-9 lg:col-span-7"
    >
      <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold tracking-[0.2em] uppercase">
        <Receipt size={14} aria-hidden="true" />
        Ventas del período
      </p>
      <p className="font-heading text-3xl font-bold tracking-tight break-words md:text-4xl">
        {principal}
      </p>
      {resto.map((linea) => (
        <p key={linea} className="text-sm font-medium text-white/70">
          {linea}
        </p>
      ))}
    </section>
  );
}

const PAGINA =
  'bg-card rounded-full border px-4 py-2 font-bold transition-colors hover:bg-secondary';

function Paginas({
  filtros,
  total,
  hoy,
}: {
  filtros: FiltrosDeVentas;
  total: number;
  hoy: string;
}) {
  const ultima = cantidadDePaginas(total);
  if (ultima === 1) return null;
  const a = (pagina: number) => enlaceDeVentas({ ...filtros, pagina }, hoy);
  return (
    <nav
      aria-label="Páginas"
      className="flex items-center justify-center gap-3 border-t p-4 text-sm"
    >
      {filtros.pagina > 1 ? (
        <Link href={a(filtros.pagina - 1)} className={PAGINA}>
          Anterior
        </Link>
      ) : null}
      <span className="text-muted-foreground font-medium">
        Página {filtros.pagina} de {ultima}
      </span>
      {filtros.pagina < ultima ? (
        <Link href={a(filtros.pagina + 1)} className={PAGINA}>
          Siguiente
        </Link>
      ) : null}
    </nav>
  );
}

function Encabezado() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <TituloDePagina subtitulo="Las ventas del período, con su total.">Ventas</TituloDePagina>
        <p className="bg-secondary text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
          <Info size={14} aria-hidden="true" />
          Fudo todavía no está conectado: por ahora se ven las ventas cargadas a mano.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <BotonDelHero href="/admin/ventas/canales">
          <Store size={16} aria-hidden="true" />
          Canales
        </BotonDelHero>
        <BotonDelHero href="/admin/ventas/nueva" principal>
          <Plus size={16} aria-hidden="true" />
          Cargar venta
        </BotonDelHero>
      </div>
    </div>
  );
}

export default async function PaginaDeVentas({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeVentas>;
}) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeVentas(await searchParams, hoy);
  const lista = await listarVentas(cliente, filtros);
  return (
    <div className="space-y-6">
      <Encabezado />
      <div className="grid gap-6 lg:grid-cols-12">
        <TotalDelPeriodo lineas={lineasDelResumen(lista.totales, filtros.estado)} />
        <Filtros filtros={filtros} />
      </div>
      <Panel titulo="Lista de ventas" etiqueta={<Etiqueta as="h2">Ventas</Etiqueta>}>
        <ListaDeVentas filas={lista.filas} />
        <Paginas filtros={{ ...filtros, pagina: lista.pagina }} total={lista.total} hoy={hoy} />
      </Panel>
    </div>
  );
}
