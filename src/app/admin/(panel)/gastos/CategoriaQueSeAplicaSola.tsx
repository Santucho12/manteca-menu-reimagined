'use client';

import Form from 'next/form';
import { SelectorDeFiltro } from '@/components/panel/SelectorDeFiltro';
import type { OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esElMesDeHoy } from '@/lib/gastos/meses';
import type { FiltrosDeGastos } from '@/lib/gastos/pantalla';

type Props = { filtros: FiltrosDeGastos; hoy: string; categorias: OpcionDeCategoria[] };

const DISPARADOR =
  'h-11 min-w-56 gap-3 rounded-full border border-border bg-white px-5 text-sm font-semibold shadow-xs transition-all hover:shadow-md focus:ring-0 focus:ring-offset-0 data-[state=open]:border-slate-300';

/** La categoría de Pagados: al elegirla se vuelve a pedir la lista, sin botón. */
export function CategoriaQueSeAplicaSola({ filtros, hoy, categorias }: Props) {
  return (
    <Form action="/admin/gastos" onChange={(evento) => evento.currentTarget.requestSubmit()}>
      {esElMesDeHoy(filtros.mes, hoy) ? null : (
        <input type="hidden" name="mes" value={filtros.mes} />
      )}
      {filtros.tipo ? <input type="hidden" name="tipo" value={filtros.tipo} /> : null}
      <SelectorDeFiltro
        name="categoria"
        etiqueta="Categoría"
        valor={filtros.categoriaId ?? ''}
        disparador={DISPARADOR}
        opciones={[
          { valor: '', texto: 'Todas las categorías' },
          ...categorias.map((categoria) => ({
            valor: categoria.id,
            texto: categoria.activo ? categoria.nombre : `${categoria.nombre} (desactivada)`,
          })),
        ]}
      />
    </Form>
  );
}
