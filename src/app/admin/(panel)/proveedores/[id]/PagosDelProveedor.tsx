import Link from 'next/link';
import { listarGastos } from '@/lib/gastos/consultas';
import { enlaceDeGastos } from '@/lib/gastos/pantalla';
import { totalesDelProveedor } from '@/lib/gastos/proveedores';
import { formatearPesos } from '@/lib/plata';
import type { Cliente } from '@/lib/supabase/cliente';
import { ListaDeGastos } from '../../gastos/ListaDeGastos';

type Props = { cliente: Cliente; proveedorId: string; hoy: string };

/** Lo que se le pago: los totales del mes y del año, y los gastos del año, sin anulados en la suma. */
export async function PagosDelProveedor({ cliente, proveedorId, hoy }: Props) {
  const anio = hoy.slice(0, 4);
  const filtros = {
    desde: `${anio}-01-01`,
    hasta: `${anio}-12-31`,
    categoriaId: null,
    proveedorId,
    pagina: 1,
  };
  const [totales, lista] = await Promise.all([
    totalesDelProveedor(cliente, proveedorId, hoy),
    listarGastos(cliente, filtros),
  ]);
  return (
    <section aria-labelledby="pagos" className="space-y-3">
      <h2 id="pagos" className="font-heading text-xl font-semibold">
        Lo pagado
      </h2>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <p>Este mes: {formatearPesos(totales.mesCentavos)}</p>
        <p>Este año: {formatearPesos(totales.anioCentavos)}</p>
      </div>
      <ListaDeGastos filas={lista.filas} />
      {lista.total > lista.filas.length ? (
        <Link href={enlaceDeGastos(filtros, hoy)} className="text-sm underline underline-offset-4">
          Ver todos sus gastos del año
        </Link>
      ) : null}
    </section>
  );
}
