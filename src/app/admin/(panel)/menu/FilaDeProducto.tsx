import Link from 'next/link';
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
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 hover:bg-secondary/50">
      <Link href={`/admin/menu/productos/${producto.id}`} className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">{producto.nombre}</span>
          {producto.etiqueta ? <Chip>{TEXTOS_DE_ETIQUETA[producto.etiqueta]}</Chip> : null}
          {producto.visible ? null : <Chip>Oculto</Chip>}
        </div>
        <p className="text-[13px] font-medium text-muted-foreground">
          {textoDePrecios(producto.precios, categoria)}
        </p>
      </Link>
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
