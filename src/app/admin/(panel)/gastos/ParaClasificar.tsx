import { PanelDeLista } from '@/components/panel/PanelDeLista';
import type {
  FilaParaClasificar as Gasto,
  Opcion,
  OpcionDeCategoria,
} from '@/lib/gastos/consultas';
import { FilaParaClasificar } from './FilaParaClasificar';

type Props = { gastos: Gasto[]; categorias: OpcionDeCategoria[]; proveedores: Opcion[] };

/** Los gastos que anotó Caja en su cierre y todavía no tienen categoría, de cualquier mes. */
export function ParaClasificar({ gastos, categorias, proveedores }: Props) {
  if (gastos.length === 0) return null;
  return (
    <PanelDeLista titulo="Para clasificar" cantidad={String(gastos.length)} acento="ambar">
      <p className="px-4 md:px-6 pt-4 text-sm text-blue-900">
        Se pagaron con la caja. Elegí la categoría de cada uno.
      </p>
      <ul aria-label="Para clasificar" className="divide-y divide-border">
        {gastos.map((gasto) => (
          <FilaParaClasificar
            key={gasto.id}
            gasto={gasto}
            categorias={categorias}
            proveedores={proveedores}
          />
        ))}
      </ul>
    </PanelDeLista>
  );
}
