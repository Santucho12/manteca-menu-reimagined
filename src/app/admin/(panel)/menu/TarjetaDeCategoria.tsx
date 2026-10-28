import { Chip } from '@/components/panel/Insignias';
import { TARJETA_DE_SECCION } from '@/components/panel/estilos';
import type { CategoriaDelPanel } from '@/lib/menu/panel';
import { cantidadDeProductos } from '@/lib/menu/pantalla';
import { BotonesDeElemento } from './BotonesDeElemento';
import { FilaDeProducto } from './FilaDeProducto';

// El rótulo «Categoría» y el nombre grande la separan de sus productos, que se ven casi igual.
export function TarjetaDeCategoria({ categoria }: { categoria: CategoriaDelPanel }) {
  const titulo = `categoria-${categoria.id}`;
  const cantidad = cantidadDeProductos(categoria.productos.length);
  return (
    <section aria-labelledby={titulo} className={TARJETA_DE_SECCION}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="text-[32px] leading-none">
            {categoria.icono}
          </span>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase leading-snug tracking-[0.18em] text-primary">
              Categoría
            </p>
            <h2
              id={titulo}
              className="font-display text-[25px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground"
            >
              {categoria.nombre}
            </h2>
          </div>
          {cantidad ? (
            <span className="mb-0.5 self-end rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {cantidad}
            </span>
          ) : null}
          {categoria.visible ? null : <Chip>Oculta</Chip>}
        </div>
        <BotonesDeElemento
          tipo="categoria"
          id={categoria.id}
          nombre={categoria.nombre}
          visible={categoria.visible}
          editar={`/admin/menu/categorias/${categoria.id}`}
        />
      </div>
      {categoria.productos.length === 0 ? (
        <p className="pt-3 text-sm text-muted-foreground">Todavía no tiene productos.</p>
      ) : (
        <ul aria-label={`Productos de ${categoria.nombre}`} className="divide-y divide-border">
          {categoria.productos.map((p) => (
            <FilaDeProducto key={p.id} producto={p} categoria={categoria.nombre} />
          ))}
        </ul>
      )}
    </section>
  );
}
