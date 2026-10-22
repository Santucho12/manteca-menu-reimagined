import Link from 'next/link';
import { ListaDeGastos } from '@/app/admin/(panel)/gastos/ListaDeGastos';
import { MOSAICO } from '@/components/panel/estilos';
import { Seccion } from '@/components/panel/Seccion';
import { listarGastos } from '@/lib/gastos/consultas';
import { enlaceDeGastos } from '@/lib/gastos/pantalla';
import { totalesDelProveedor } from '@/lib/gastos/proveedores';
import { formatearPesos } from '@/lib/plata';
import type { Cliente } from '@/lib/supabase/cliente';

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
    <Seccion titulo="Lo pagado" forma="lista">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <p className={`${MOSAICO} text-sm font-semibold`}>
          Este mes: {formatearPesos(totales.mesCentavos)}
        </p>
        <p className={`${MOSAICO} text-sm font-semibold`}>
          Este año: {formatearPesos(totales.anioCentavos)}
        </p>
      </div>
      <ListaDeGastos filas={lista.filas} total={lista.total} />
      {lista.total > lista.filas.length ? (
        <Link
          href={enlaceDeGastos(filtros, hoy)}
          className="text-sm font-bold text-primary hover:underline underline-offset-4"
        >
          Ver todos sus gastos del año
        </Link>
      ) : null}
    </Seccion>
  );
}
