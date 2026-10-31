import type { FilaDeGasto as Gasto } from '@/lib/gastos/consultas';
import { FilaDeGasto } from './FilaDeGasto';

type Props = { filas: Gasto[]; vacio?: string };

/** Los gastos en filas: en Pagados y en la ficha de un proveedor. */
export function ListaDeGastos({ filas, vacio = 'No hay gastos para mostrar.' }: Props) {
  if (filas.length === 0) {
    return <p className="p-10 text-center text-sm text-muted-foreground font-medium">{vacio}</p>;
  }
  return (
    <ul aria-label="Gastos" className="space-y-0.5 p-2">
      {filas.map((gasto) => (
        <FilaDeGasto key={gasto.id} gasto={gasto} />
      ))}
    </ul>
  );
}
