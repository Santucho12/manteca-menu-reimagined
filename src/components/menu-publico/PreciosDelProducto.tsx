import type { PrecioPublico } from '@/lib/menu/publico';

// Al costado del nombre o debajo, según `disposicionDePrecios` (src/lib/menu/disposicion.ts).
type Props = { precios: PrecioPublico[]; className: string };

export function PreciosDelProducto({ precios, className }: Props) {
  if (precios.length === 0) return null;
  return (
    <div className={className}>
      {precios.map((precio, i) => (
        // Abajo: si un rótulo largo baja de renglón, los precios igual quedan alineados.
        <div key={`${precio.etiqueta}-${i}`} className="flex flex-col items-center justify-end">
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
