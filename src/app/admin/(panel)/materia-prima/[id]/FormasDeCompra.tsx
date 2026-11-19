import Link from 'next/link';
import { FALTA_EL_DATO } from '@/components/panel/estilos';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Seccion } from '@/components/panel/Seccion';
import type { FormaDeCompra, Insumo } from '@/lib/materia-prima/consultas';
import { contenidoParaEditar } from '@/lib/materia-prima/esquemas';
import { textoDeUnidad } from '@/lib/materia-prima/pantalla';
import { formatearPesos } from '@/lib/plata';

function Forma({ forma, insumo }: { forma: FormaDeCompra; insumo: Insumo }) {
  const unidad = textoDeUnidad(insumo.unidad_de_uso).toLowerCase();
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/admin/materia-prima/${insumo.id}/formas/${forma.id}`}
          className="text-sm font-bold wrap-break-word hover:text-primary"
        >
          {forma.como_se_compra}
        </Link>
        <p className="text-xs text-muted-foreground wrap-break-word">
          {forma.proveedor ?? 'Sin proveedor'} · Trae {contenidoParaEditar(forma.contenido)}{' '}
          {unidad}
        </p>
        {forma.activo ? null : <InsigniaDeEstado tono="pizarra">Desactivada</InsigniaDeEstado>}
      </div>
      <p className="text-sm font-bold whitespace-nowrap">
        <span className="sr-only">Precio de referencia: </span>
        {forma.precio_referencia_centavos === null ? (
          <span className={FALTA_EL_DATO}>Sin precio</span>
        ) : (
          formatearPesos(forma.precio_referencia_centavos)
        )}
      </p>
    </li>
  );
}

/** A quien y en que presentacion se compra el insumo, con su precio de referencia. */
export function FormasDeCompra({ insumo }: { insumo: Insumo }) {
  return (
    <Seccion titulo="Formas de compra" forma="lista">
      {insumo.formas.length === 0 ? (
        <p className={FALTA_EL_DATO}>Todavía no cargaste cómo se compra.</p>
      ) : (
        <ul aria-label="Formas de compra" className="divide-y divide-border">
          {insumo.formas.map((forma) => (
            <Forma key={forma.id} forma={forma} insumo={insumo} />
          ))}
        </ul>
      )}
    </Seccion>
  );
}
