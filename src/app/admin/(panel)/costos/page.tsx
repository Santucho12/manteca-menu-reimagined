import { SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { FiltroEnlace } from '@/components/panel/Filtros';
import { Pantalla } from '@/components/panel/Pantalla';
import { SinResultados } from '@/components/panel/SinResultados';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { listarCostos, type ProductoConCosto } from '@/lib/costos/consultas';
import type { FiltroDeCostos, FiltrosDeCostos } from '@/lib/costos/lista';
import {
  enlaceDeCostos,
  filtrosDeCostos,
  vacioDeCostos,
  type ParametrosDeCostos,
} from '@/lib/costos/pantalla';
import { Presentaciones } from './Presentaciones';

export const metadata: Metadata = { title: 'Costos' };

const FILTROS: [FiltroDeCostos, string][] = [
  ['todos', 'Todos'],
  ['debajo', 'Debajo del mínimo'],
  ['sin_receta', 'Sin receta'],
];

function Filtros({ filtros }: { filtros: FiltrosDeCostos }) {
  const otroOrden = filtros.orden === 'porcentaje' ? 'nombre' : 'porcentaje';
  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {FILTROS.map(([filtro, texto]) => (
        <FiltroEnlace
          key={filtro}
          href={enlaceDeCostos({ ...filtros, filtro })}
          prendido={filtros.filtro === filtro}
        >
          {texto}
        </FiltroEnlace>
      ))}
      <FiltroEnlace href={enlaceDeCostos({ ...filtros, orden: otroOrden })} prendido={false}>
        {otroOrden === 'nombre' ? 'Ordenar por nombre' : 'Ordenar por ganancia'}
      </FiltroEnlace>
    </div>
  );
}

function Producto({ fila }: { fila: ProductoConCosto }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div>
        <Link
          href={`/admin/costos/productos/${fila.productoId}`}
          className="text-sm font-bold wrap-break-word hover:text-primary"
        >
          {fila.producto}
        </Link>
        <p className="text-xs text-muted-foreground">{fila.categoria}</p>
      </div>
      <Presentaciones filas={fila.presentaciones} />
    </li>
  );
}

const Ajustes = () => (
  <Link href="/admin/costos/ajustes" className={BOTON_DE_ENCABEZADO_NEUTRO}>
    <SlidersHorizontal size={18} aria-hidden="true" /> Ajustes
  </Link>
);

export default async function PaginaDeCostos({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeCostos>;
}) {
  const filtros = filtrosDeCostos(await searchParams);
  const { datos: filas } = await exigirPaginaYLeer('admin', (c) => listarCostos(c, filtros));
  return (
    <Pantalla
      titulo="Costos"
      subtitulo="Cuánto te cuesta cada producto y cuánto te deja con el precio del menú."
      acciones={<Ajustes />}
      ayuda="costos"
    >
      <Filtros filtros={filtros} />
      {filas.length === 0 ? (
        <SinResultados {...vacioDeCostos(filtros.filtro)} />
      ) : (
        <ul aria-label="Costos" className="space-y-3">
          {filas.map((fila) => (
            <Producto key={fila.productoId} fila={fila} />
          ))}
        </ul>
      )}
    </Pantalla>
  );
}
