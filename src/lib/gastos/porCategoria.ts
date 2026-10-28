export type GastoParaAgrupar = {
  id: string;
  categoria_id: string;
  categoria: string;
  monto_centavos: number;
  fecha: string;
  descripcion: string | null;
};
export type GastoDeCategoria = {
  id: string;
  fecha: string;
  descripcion: string | null;
  montoCentavos: number;
};
export type ResumenDeCategoria = {
  categoriaId: string;
  nombre: string;
  cantidad: number;
  totalCentavos: number;
  /** Los gastos de la categoria, el mas reciente primero. */
  gastos: GastoDeCategoria[];
};

function sumar(previo: ResumenDeCategoria | undefined, g: GastoParaAgrupar): ResumenDeCategoria {
  const gasto = {
    id: g.id,
    fecha: g.fecha,
    descripcion: g.descripcion,
    montoCentavos: g.monto_centavos,
  };
  return {
    categoriaId: g.categoria_id,
    nombre: g.categoria,
    cantidad: (previo?.cantidad ?? 0) + 1,
    totalCentavos: (previo?.totalCentavos ?? 0) + g.monto_centavos,
    gastos: [...(previo?.gastos ?? []), gasto].sort((a, b) => b.fecha.localeCompare(a.fecha)),
  };
}

/** Cuantos gastos y cuanto suman por categoria: la que mas suma primero, y a igual total por nombre. */
export function agruparPorCategoria(gastos: GastoParaAgrupar[]): ResumenDeCategoria[] {
  const porCategoria = new Map<string, ResumenDeCategoria>();
  for (const g of gastos)
    porCategoria.set(g.categoria_id, sumar(porCategoria.get(g.categoria_id), g));
  return [...porCategoria.values()].sort(
    (a, b) => b.totalCentavos - a.totalCentavos || a.nombre.localeCompare(b.nombre),
  );
}
