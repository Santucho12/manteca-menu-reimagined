import type { PrecioPublico } from '@/lib/menu/publico';

export function PreciosDelProducto({ precios }: { precios: PrecioPublico[] }) {
  if (precios.length === 0) return null;
  return (
    <div className="flex shrink-0 justify-end gap-4 text-right sm:gap-6">
      {precios.map((precio, i) => (
        <div key={`${precio.etiqueta}-${i}`} className="flex flex-col items-center">
          {precio.etiqueta ? (
            <span className="text-muted-foreground mb-0.5 text-[9px] font-bold tracking-widest uppercase">
              {precio.etiqueta}
            </span>
          ) : null}
          <span className="text-sm font-medium">{precio.texto}</span>
        </div>
      ))}
    </div>
  );
}
