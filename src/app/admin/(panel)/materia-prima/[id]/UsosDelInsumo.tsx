import Link from 'next/link';
import { ENLACE_EN_TEXTO } from '@/components/panel/Avisos';
import { FALTA_EL_DATO } from '@/components/panel/estilos';
import { Seccion } from '@/components/panel/Seccion';
import { comprasDelInsumo } from '@/lib/compras/delInsumo';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { contenidoParaEditar } from '@/lib/materia-prima/esquemas';
import { renglonesDeReceta, usosDelInsumo } from '@/lib/materia-prima/usos';
import { formatearPesos } from '@/lib/plata';
import type { Cliente } from '@/lib/supabase/cliente';

type Props = { cliente: Cliente; insumoId: string };

/** Los productos cuya receta lo usa: si cambia su precio, cambia el costo de estos. */
export async function RecetasDelInsumo({ cliente, insumoId }: Props) {
  const usos = usosDelInsumo(await renglonesDeReceta(cliente, [insumoId]));
  return (
    <Seccion titulo="Recetas que lo usan" forma="lista">
      {usos.length === 0 ? (
        <p className={FALTA_EL_DATO}>Todavía no está en ninguna receta.</p>
      ) : (
        <ul aria-label="Recetas que lo usan" className="space-y-2 text-sm">
          {usos.map((uso) => (
            <li key={uso.recetaId}>
              <Link href={`/admin/costos/productos/${uso.productoId}`} className={ENLACE_EN_TEXTO}>
                {uso.producto}
              </Link>
              {uso.presentacion ? ` · receta propia de ${uso.presentacion}` : null}
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}

/** Las ultimas compras que lo trajeron, para ver a quien y a cuanto se le compro. */
export async function ComprasDelInsumo({ cliente, insumoId }: Props) {
  const compras = await comprasDelInsumo(cliente, insumoId);
  return (
    <Seccion titulo="Últimas compras" forma="lista">
      {compras.length === 0 ? (
        <p className={FALTA_EL_DATO}>Todavía no llegó en ninguna compra.</p>
      ) : (
        <ul aria-label="Últimas compras" className="divide-y divide-border text-sm">
          {compras.map((c) => (
            <li
              key={`${c.compraId}-${c.comoSeCompra}`}
              className="flex flex-wrap justify-between gap-3 py-2"
            >
              <Link href={`/admin/compras/${c.compraId}`} className={ENLACE_EN_TEXTO}>
                {fechaParaMostrar(c.fecha)} · {c.proveedor}
              </Link>
              <span className="whitespace-nowrap">
                {contenidoParaEditar(c.cantidad)} × {c.comoSeCompra} a{' '}
                {formatearPesos(c.precioCentavos)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}
