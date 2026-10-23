import { Chip } from '@/components/panel/Insignias';
import type { ProductoDelPanel } from '@/lib/menu/panel';
import { textoDePrecios } from '@/lib/menu/pantalla';
import { TEXTOS_DE_ETIQUETA } from '@/lib/menu/publico';
import { BotonesDeElemento } from './BotonesDeElemento';

export function FilaDeProducto({
  producto,
  categoria,
}: {
  producto: ProductoDelPanel;
  categoria: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">{producto.nombre}</span>
          {producto.etiqueta ? <Chip>{TEXTOS_DE_ETIQUETA[producto.etiqueta]}</Chip> : null}
          {producto.visible ? null : <Chip>Oculto</Chip>}
        </div>
        <p className="text-xs text-muted-foreground">
          {textoDePrecios(producto.precios, categoria)}
        </p>
      </div>
      <BotonesDeElemento
        tipo="producto"
        id={producto.id}
        nombre={producto.nombre}
        visible={producto.visible}
        editar={`/admin/menu/productos/${producto.id}`}
      />
    </li>
  );
}
