import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';

export type Vista = {
  desde: string;
  hasta: string;
  dias: number;
  ventas: number;
  totalCentavos: number;
};

/** Lo que entra al guardar, para revisarlo antes. */
export function VistaDeLaSubida({ vista }: { vista: Vista }) {
  const { desde, hasta, dias, ventas, totalCentavos } = vista;
  return (
    <section aria-label="Lo que entra" className="space-y-1 rounded-xl bg-secondary/40 p-4">
      <p className="text-lg font-bold">
        {ventas} {ventas === 1 ? 'venta' : 'ventas'} · {formatearPesos(totalCentavos)}
      </p>
      <p className="text-sm text-muted-foreground">
        Del {fechaParaMostrar(desde)} al {fechaParaMostrar(hasta)} · {dias}{' '}
        {dias === 1 ? 'día' : 'días'}
      </p>
      <p className="text-xs text-muted-foreground">
        Si ya habías subido esos días, se actualizan: no se suman otra vez.
      </p>
    </section>
  );
}
