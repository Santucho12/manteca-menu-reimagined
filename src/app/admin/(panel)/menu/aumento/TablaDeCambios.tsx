import { Chip } from '@/components/panel/Insignias';
import { SinResultados } from '@/components/panel/SinResultados';
import { TITULO_DE_COLUMNA } from '@/components/panel/estilos';
import type { CambioDePrecio } from '@/lib/menu/aumento';
import { formatearPesosEnteros } from '@/lib/plata';

const CELDA = 'py-3 px-3 align-top text-xs';

export function TablaDeCambios({ cambios }: { cambios: CambioDePrecio[] }) {
  if (cambios.length === 0) {
    return (
      <SinResultados titulo="Sin cambios" texto="No hay precios para aumentar en ese alcance." />
    );
  }
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <table aria-label="Cambios de precio" className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className={TITULO_DE_COLUMNA}>Qué</th>
            <th className={TITULO_DE_COLUMNA}>Ahora</th>
            <th className={TITULO_DE_COLUMNA}>Queda</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cambios.map((c) => (
            <tr key={c.id}>
              {/* El nombre se parte en renglones: en el celular los precios tienen que verse. */}
              <td className={`${CELDA} font-semibold`}>
                {c.producto ?? `${c.categoria} · precio para todos`}{' '}
                {c.oculto ? <Chip>Oculto</Chip> : null}
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {c.presentacion}
                </span>
              </td>
              <td className={`${CELDA} whitespace-nowrap`}>
                {formatearPesosEnteros(c.montoCentavos)}
              </td>
              <td className={`${CELDA} whitespace-nowrap font-bold`}>
                {formatearPesosEnteros(c.nuevoCentavos)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
