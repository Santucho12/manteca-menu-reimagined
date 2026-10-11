import type { Punto } from './agrupar';

export type GastoDelDia = {
  dia: string;
  categoria_id: string;
  categoria: string;
  monto_centavos: number;
};
export type FilaDeGasto = { clave: string; nombre: string; montoCentavos: number };

export const totalDeGastos = (filas: GastoDelDia[]) =>
  filas.reduce((suma, f) => suma + f.monto_centavos, 0);

/** Lo de cada categoria, de la que mas gasto a la que menos. */
export function gastosPorCategoria(filas: GastoDelDia[]): FilaDeGasto[] {
  const categorias = new Map<string, FilaDeGasto>();
  for (const f of filas) {
    const previo = categorias.get(f.categoria_id) ?? {
      clave: f.categoria_id,
      nombre: f.categoria,
      montoCentavos: 0,
    };
    categorias.set(f.categoria_id, {
      ...previo,
      montoCentavos: previo.montoCentavos + f.monto_centavos,
    });
  }
  return [...categorias.values()].sort((a, b) => b.montoCentavos - a.montoCentavos);
}

export function puntosDeGastos(filas: GastoDelDia[]): Punto[] {
  const dias = new Map<string, number>();
  for (const f of filas) dias.set(f.dia, (dias.get(f.dia) ?? 0) + f.monto_centavos);
  return [...dias.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, montoCentavos]) => ({ clave, montoCentavos, cantidad: 0 }));
}
