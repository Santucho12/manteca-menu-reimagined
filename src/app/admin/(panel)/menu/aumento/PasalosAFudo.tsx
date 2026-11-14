import type { CambioDePrecio } from '@/lib/menu/aumento';
import { TablaDeCambios } from './TablaDeCambios';

/** Fudo no se entera del aumento: la lista queda para copiar los precios nuevos a mano. */
export function PasalosAFudo({ cambios }: { cambios: CambioDePrecio[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-foreground">Pasalos a Fudo</h2>
        <p className="text-sm text-muted-foreground">
          Fudo sigue cobrando los precios de antes: cambiá estos también allá.
        </p>
      </div>
      <TablaDeCambios cambios={cambios} nombre="Pasalos a Fudo" />
    </section>
  );
}
