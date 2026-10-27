import { gastosPorCategoria, totalDeGastos, type GastoDelDia } from '../reportes/gastos';

export type Rebanada = {
  clave: string;
  nombre: string;
  montoCentavos: number;
  porcentaje: number;
};

const MAXIMO_DE_REBANADAS = 5;

const conPorcentaje = (montoCentavos: number, total: number) =>
  Math.round((montoCentavos * 1000) / total) / 10;

/** Lo que cada categoria se llevo del gasto; con mas de cinco, las ultimas se juntan en Otras. */
export function rebanadasDeGastos(filas: GastoDelDia[]): Rebanada[] {
  const total = totalDeGastos(filas);
  if (total <= 0) return [];
  const categorias = gastosPorCategoria(filas).filter((c) => c.montoCentavos > 0);
  const visibles = categorias.slice(0, MAXIMO_DE_REBANADAS);
  if (categorias.length > MAXIMO_DE_REBANADAS) {
    const resto = categorias.slice(MAXIMO_DE_REBANADAS - 1);
    visibles.splice(MAXIMO_DE_REBANADAS - 1, 1, {
      clave: 'otras',
      nombre: 'Otras',
      montoCentavos: resto.reduce((suma, c) => suma + c.montoCentavos, 0),
    });
  }
  return visibles.map((c) => ({ ...c, porcentaje: conPorcentaje(c.montoCentavos, total) }));
}
