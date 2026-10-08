import { Badge } from '@/components/ui/badge';
import type { CategoriaDelPanel } from '@/lib/menu/panel';
import { BotonesDeElemento } from './BotonesDeElemento';
import { FilaDeProducto } from './FilaDeProducto';

export function TarjetaDeCategoria({ categoria }: { categoria: CategoriaDelPanel }) {
  const titulo = `categoria-${categoria.id}`;
  return (
    <section aria-labelledby={titulo} className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className="text-2xl">
          {categoria.icono}
        </span>
        <h2 id={titulo} className="text-xl font-semibold">
          {categoria.nombre}
        </h2>
        {categoria.visible ? null : <Badge variant="outline">Oculta</Badge>}
      </div>
      <BotonesDeElemento
        tipo="categoria"
        id={categoria.id}
        nombre={categoria.nombre}
        visible={categoria.visible}
        editar={`/admin/menu/categorias/${categoria.id}`}
      />
      {categoria.productos.length === 0 ? (
        <p className="text-muted-foreground text-sm">Todavía no tiene productos.</p>
      ) : (
        <ul aria-label={`Productos de ${categoria.nombre}`}>
          {categoria.productos.map((p) => (
            <FilaDeProducto key={p.id} producto={p} categoria={categoria.nombre} />
          ))}
        </ul>
      )}
    </section>
  );
}
