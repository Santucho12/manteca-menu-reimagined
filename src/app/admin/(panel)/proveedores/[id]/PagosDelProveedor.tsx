import { ListaDeGastos } from '@/app/admin/(panel)/gastos/ListaDeGastos';
import { MOSAICO } from '@/components/panel/estilos';
import { Seccion } from '@/components/panel/Seccion';
import { listarGastos } from '@/lib/gastos/consultas';
import { totalesDelProveedor } from '@/lib/gastos/proveedores';
import { formatearPesos } from '@/lib/plata';
import type { Cliente } from '@/lib/supabase/cliente';

type Props = { cliente: Cliente; proveedorId: string; hoy: string; porPagarCentavos: number };

/**
 * Lo que se le pago: los totales del mes y del año, y los primeros 25 gastos del año. Gastos ya
 * no filtra por proveedor, por eso no hay "ver todos".
 */
export async function PagosDelProveedor({ cliente, proveedorId, hoy, porPagarCentavos }: Props) {
  const anio = hoy.slice(0, 4);
  const filtros = { desde: `${anio}-01-01`, hasta: `${anio}-12-31`, proveedorId, pagina: 1 };
  const [totales, lista] = await Promise.all([
    totalesDelProveedor(cliente, proveedorId, hoy),
    listarGastos(cliente, filtros),
  ]);
  return (
    <Seccion titulo="Lo pagado" forma="lista">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <p className={`${MOSAICO} text-sm font-semibold`}>
          Este mes: {formatearPesos(totales.mesCentavos)}
        </p>
        <p className={`${MOSAICO} text-sm font-semibold`}>
          Este año: {formatearPesos(totales.anioCentavos)}
        </p>
        <p className={`${MOSAICO} text-sm font-semibold`}>
          Por pagar: {formatearPesos(porPagarCentavos)}
        </p>
      </div>
      <ListaDeGastos filas={lista.filas} vacio="Todavía no se le pagó nada este año." />
    </Seccion>
  );
}
