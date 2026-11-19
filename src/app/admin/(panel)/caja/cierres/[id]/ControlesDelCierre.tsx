import { textoDelControl, type ResultadoDeControl } from '@/lib/caja/controles';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';

function ControlDeUnTipo({ control }: { control: ResultadoDeControl }) {
  return (
    <section
      aria-label={control.tipo}
      className={cn(
        'rounded-2xl border p-4 space-y-1',
        control.fuera ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50',
      )}
    >
      <p className="font-display font-bold">{control.tipo}</p>
      <p className="text-sm">Facturado {formatearPesos(control.anotadoCentavos)}</p>
      <p className="text-sm">
        Cargado {formatearPesos(control.cargadoCentavos)} en {control.cantidadCargada}{' '}
        {control.cantidadCargada === 1 ? 'venta' : 'ventas'}
      </p>
      <p className="text-sm font-semibold">{textoDelControl(control)}</p>
    </section>
  );
}

/** Lo que dijo la facturación de cada tipo controlado contra lo cargado en el turno (pedido 99). */
export function ControlesDelCierre({ controles }: { controles: ResultadoDeControl[] }) {
  if (controles.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-display text-lg font-bold">Por tipo de venta</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {controles.map((control) => (
          <ControlDeUnTipo key={control.canalId} control={control} />
        ))}
      </div>
    </div>
  );
}
