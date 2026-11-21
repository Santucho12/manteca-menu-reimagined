import { ListaOrdenable } from './ListaOrdenable';

type Canal = { id: string; nombre: string; activo: boolean };

/** Los tipos de venta en una sola tarjeta: una fila por tipo, que se ordena arrastrando, con editar, activar y borrar a la derecha. */
export function TarjetasDeCanales({ canales }: { canales: Canal[] }) {
  return (
    <section
      aria-labelledby="canales-titulo"
      className="rounded-2xl border border-border bg-white p-3 shadow-card md:p-4"
    >
      <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2">
        <h2 id="canales-titulo" className="font-display text-lg font-bold tracking-tight">
          Tipos de venta
        </h2>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {canales.length} {canales.length === 1 ? 'tipo' : 'tipos'}
        </span>
      </div>
      <ListaOrdenable canales={canales} />
    </section>
  );
}
