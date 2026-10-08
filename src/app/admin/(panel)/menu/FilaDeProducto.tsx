import { Badge } from '@/components/ui/badge';
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
    <li className="space-y-2 border-t py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{producto.nombre}</span>
        {producto.etiqueta ? (
          <Badge variant="secondary">{TEXTOS_DE_ETIQUETA[producto.etiqueta]}</Badge>
        ) : null}
        {producto.visible ? null : <Badge variant="outline">Oculto</Badge>}
      </div>
      <p className="text-muted-foreground text-sm">{textoDePrecios(producto.precios, categoria)}</p>
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
