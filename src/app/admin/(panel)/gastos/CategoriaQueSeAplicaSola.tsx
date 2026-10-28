'use client';

import Form from 'next/form';
import { CAMPO_DE_FILTRO } from '@/components/panel/estilos';
import type { OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esElMesDeHoy } from '@/lib/gastos/meses';
import type { FiltrosDeGastos } from '@/lib/gastos/pantalla';

type Props = { filtros: FiltrosDeGastos; hoy: string; categorias: OpcionDeCategoria[] };

/** La categoría de Pagados: al elegirla se vuelve a pedir la lista, sin botón. */
export function CategoriaQueSeAplicaSola({ filtros, hoy, categorias }: Props) {
  return (
    <Form action="/admin/gastos" onChange={(evento) => evento.currentTarget.requestSubmit()}>
      {esElMesDeHoy(filtros.mes, hoy) ? null : (
        <input type="hidden" name="mes" value={filtros.mes} />
      )}
      {filtros.tipo ? <input type="hidden" name="tipo" value={filtros.tipo} /> : null}
      <label htmlFor="filtro-categoria" className="sr-only">
        Categoría
      </label>
      <select
        id="filtro-categoria"
        name="categoria"
        defaultValue={filtros.categoriaId ?? ''}
        className={`${CAMPO_DE_FILTRO} md:h-10 md:rounded-xl`}
      >
        <option value="">Todas las categorías</option>
        {categorias.map((categoria) => (
          <option key={categoria.id} value={categoria.id}>
            {categoria.activo ? categoria.nombre : `${categoria.nombre} (desactivada)`}
          </option>
        ))}
      </select>
    </Form>
  );
}
