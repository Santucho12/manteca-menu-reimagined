import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Paginas } from '@/components/panel/Paginas';
import { ETIQUETA } from '@/components/panel/estilos';
import { PanelDeLista } from '@/components/panel/PanelDeLista';
import type { ListaDeGastos as Lista, OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esElMesDeHoy, mesAnterior, mesSiguiente, nombreDelMes } from '@/lib/gastos/meses';
import { enlaceDeGastos, type FiltrosDeGastos, type TipoDeGasto } from '@/lib/gastos/pantalla';
import { cantidadDeResultados } from '@/lib/panel/lista';
import { formatearPesos } from '@/lib/plata';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { cn } from '@/lib/utils';
import { CategoriaQueSeAplicaSola } from './CategoriaQueSeAplicaSola';
import { ListaDeGastos } from './ListaDeGastos';

type Props = {
  lista: Lista;
  filtros: FiltrosDeGastos;
  hoy: string;
  categorias: OpcionDeCategoria[];
};

const FLECHA =
  'size-9 pointer-coarse:size-11 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all';
const TIPOS: { tipo: TipoDeGasto | null; texto: string }[] = [
  { tipo: null, texto: 'Todos' },
  { tipo: 'fijos', texto: 'Fijos' },
  { tipo: 'caja', texto: 'De caja' },
];

function MesConFlechas({ filtros, hoy }: Pick<Props, 'filtros' | 'hoy'>) {
  const ir = (mes: string) => enlaceDeGastos({ ...filtros, mes, pagina: 1 }, hoy);
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-white p-1 shadow-xs">
      <Link href={ir(mesAnterior(filtros.mes))} aria-label="Mes anterior" className={FLECHA}>
        <ChevronLeft size={16} aria-hidden="true" />
      </Link>
      <span className="min-w-[8.5rem] text-center font-display text-sm font-bold capitalize">
        {nombreDelMes(filtros.mes)}
      </span>
      {esElMesDeHoy(filtros.mes, hoy) ? (
        <span className="size-9 pointer-coarse:size-11" aria-hidden="true" />
      ) : (
        <Link href={ir(mesSiguiente(filtros.mes))} aria-label="Mes siguiente" className={FLECHA}>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function Tipos({ filtros, hoy }: Pick<Props, 'filtros' | 'hoy'>) {
  return (
    <nav aria-label="Tipo de gasto" className="flex gap-1 rounded-full bg-secondary/60 p-1">
      {TIPOS.map(({ tipo, texto }) => (
        <Link
          key={texto}
          href={enlaceDeGastos({ ...filtros, tipo, pagina: 1 }, hoy)}
          aria-current={filtros.tipo === tipo ? 'true' : undefined}
          className={cn(
            'inline-flex h-9 pointer-coarse:h-11 items-center rounded-full px-4 text-sm font-semibold transition-all',
            filtros.tipo === tipo
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}

/** Lo pagado en el mes elegido, con sus filtros, su total y sus páginas. */
export function Pagados({ lista, filtros, hoy, categorias }: Props) {
  const ultima = cantidadDePaginas(lista.total);
  const conFiltros = filtros.tipo !== null || filtros.categoriaId !== null;
  const vacio = conFiltros
    ? 'No hay gastos que coincidan con los filtros.'
    : `No hay gastos en ${nombreDelMes(filtros.mes).split(' ')[0]}.`;
  return (
    <PanelDeLista
      titulo="Pagados"
      contador="verde"
      desplegable={{
        abierto: conFiltros || filtros.pagina > 1 || !esElMesDeHoy(filtros.mes, hoy),
        tituloCerrado: 'Ver los pagados',
      }}
      cantidad={cantidadDeResultados(lista.total)}
      extra={<MesConFlechas filtros={filtros} hoy={hoy} />}
    >
      <div className="px-4 md:px-6 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tipos filtros={filtros} hoy={hoy} />
          <CategoriaQueSeAplicaSola filtros={filtros} hoy={hoy} categorias={categorias} />
        </div>
        <p className="flex items-baseline gap-2 px-1">
          <span className={ETIQUETA}>Total:</span>{' '}
          <strong className="font-display text-xl font-bold tracking-tight">
            {formatearPesos(lista.totalCentavos)}
          </strong>
        </p>
      </div>
      <ListaDeGastos filas={lista.filas} vacio={vacio} />
      {ultima > 1 ? (
        <div className="px-4 md:px-6 py-3 border-t border-border">
          <Paginas
            pagina={lista.pagina}
            ultima={ultima}
            enlaceA={(pagina) => enlaceDeGastos({ ...filtros, pagina }, hoy)}
          />
        </div>
      ) : null}
    </PanelDeLista>
  );
}
