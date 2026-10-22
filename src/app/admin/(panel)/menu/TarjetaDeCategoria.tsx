import { Chip } from '@/components/panel/Insignias';
import { TARJETA_DE_SECCION } from '@/components/panel/estilos';
import type { CategoriaDelPanel } from '@/lib/menu/panel';
import { BotonesDeElemento } from './BotonesDeElemento';
import { FilaDeProducto } from './FilaDeProducto';

export function TarjetaDeCategoria({ categoria }: { categoria: CategoriaDelPanel }) {
  const titulo = `categoria-${categoria.id}`;
  return (
    <section aria-labelledby={titulo} className={`${TARJETA_DE_SECCION} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="text-2xl">
            {categoria.icono}
          </span>
          <h2 id={titulo} className="text-xl font-bold tracking-tight text-slate-800">
            {categoria.nombre}
          </h2>
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
        <p className="text-sm text-muted-foreground">Todavía no tiene productos.</p>
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
