import type { Metadata } from 'next';
import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { MEDIOS } from '@/lib/caja/resultado';
import { nombreDeMedio } from '@/lib/caja/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { formatearPesos } from '@/lib/plata';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { listarVentas, type Totales } from '@/lib/ventas/consultas';
import {
  enlaceDeVentas,
  filtrosDeVentas,
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
    <form action="/admin/ventas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
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
      <Button type="submit">Filtrar</Button>
    </form>
  );
}

const ventas = (cantidad: number) => `${cantidad} ${cantidad === 1 ? 'venta' : 'ventas'}`;

function Resumen({ totales }: { totales: Totales }) {
  return (
    <div className="space-y-1">
      <p className="text-lg font-semibold">
        Cobrado: {formatearPesos(totales.cobradoCentavos)} en {ventas(totales.cobradas)}
      </p>
      {totales.canceladas > 0 ? (
        <p className="text-muted-foreground text-sm">
          Canceladas: {formatearPesos(totales.canceladoCentavos)} en {ventas(totales.canceladas)}
        </p>
      ) : null}
    </div>
  );
}

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
    <nav aria-label="Páginas" className="flex items-center gap-4 text-sm">
      {filtros.pagina > 1 ? <Link href={a(filtros.pagina - 1)}>Anterior</Link> : null}
      <span>
        Página {filtros.pagina} de {ultima}
      </span>
      {filtros.pagina < ultima ? <Link href={a(filtros.pagina + 1)}>Siguiente</Link> : null}
    </nav>
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
      <TituloDePagina>Ventas</TituloDePagina>
      <p className="text-muted-foreground max-w-xl text-sm">
        Fudo todavía no está conectado: por ahora se ven las ventas cargadas a mano.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/ventas/nueva">Cargar venta</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/ventas/canales">Canales</Link>
        </Button>
      </div>
      <Filtros filtros={filtros} />
      <Resumen totales={lista.totales} />
      <ListaDeVentas filas={lista.filas} />
      <Paginas filtros={{ ...filtros, pagina: lista.pagina }} total={lista.total} hoy={hoy} />
    </div>
  );
}
