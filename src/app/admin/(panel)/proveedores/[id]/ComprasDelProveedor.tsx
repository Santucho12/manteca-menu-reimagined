import Link from 'next/link';
import { ENLACE_EN_TEXTO } from '@/components/panel/Avisos';
import { FALTA_EL_DATO } from '@/components/panel/estilos';
import { Seccion } from '@/components/panel/Seccion';
import { comprasDelProveedor, formasParaComprar } from '@/lib/compras/consultas';
import { estadoDeCompra } from '@/lib/compras/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import type { Cliente } from '@/lib/supabase/cliente';

type Props = { cliente: Cliente; proveedorId: string };

/** Sus ultimas compras y lo que se le compra (sus formas de compra), con el ultimo precio. */
export async function ComprasDelProveedor({ cliente, proveedorId }: Props) {
  const [compras, formas] = await Promise.all([
    comprasDelProveedor(cliente, proveedorId),
    formasParaComprar(cliente),
  ]);
  const suyas = formas.filter((f) => f.proveedorId === proveedorId);
  return (
    <Seccion titulo="Compras" forma="lista">
      {compras.length === 0 ? (
        <p className={FALTA_EL_DATO}>Todavía no se le cargó ninguna compra.</p>
      ) : (
        <ul aria-label="Compras del proveedor" className="divide-y divide-border text-sm">
          {compras.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 py-2">
              <Link href={`/admin/compras/${c.id}`} className={ENLACE_EN_TEXTO}>
                {c.fecha ? fechaParaMostrar(c.fecha) : 'Pedido'} · {estadoDeCompra(c)}
              </Link>
              <span className="font-bold">{formatearPesos(c.total_centavos)}</span>
            </li>
          ))}
        </ul>
      )}
      {suyas.length === 0 ? null : (
        <p className="text-xs text-muted-foreground">
          Le comprás:{' '}
          {suyas
            .map(
              (f) =>
                `${f.insumo} (${f.comoSeCompra}${f.ultimoPrecioCentavos === null ? '' : `, última ${formatearPesos(f.ultimoPrecioCentavos)}`})`,
            )
            .join(' · ')}
        </p>
      )}
    </Seccion>
  );
}
