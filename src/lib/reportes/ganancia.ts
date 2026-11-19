export type GananciaLeida = {
  producto_id: string | null;
  producto: string;
  unidades: number;
  ventas_centavos: number;
  costo_centavos: number;
  ganancia_centavos: number;
  sin_costo: number;
};
export type FilaDeGanancia = {
  clave: string;
  producto: string;
  unidades: number;
  ventasCentavos: number;
  costoCentavos: number;
  gananciaCentavos: number;
  porcentaje: number | null;
  sinCosto: number;
};

/** La ganancia como parte de lo vendido que tiene costo: ganancia / (ganancia + costo). */
function porcentajeDe(ganancia: number, costo: number): number | null {
  const conCosto = ganancia + costo;
  return conCosto > 0 ? (ganancia * 100) / conCosto : null;
}

export function filasDeGanancia(filas: GananciaLeida[]): FilaDeGanancia[] {
  return filas.map((f) => ({
    clave: f.producto_id ?? f.producto,
    producto: f.producto,
    unidades: Number(f.unidades),
    ventasCentavos: f.ventas_centavos,
    costoCentavos: f.costo_centavos,
    gananciaCentavos: f.ganancia_centavos,
    porcentaje: porcentajeDe(f.ganancia_centavos, f.costo_centavos),
    sinCosto: f.sin_costo,
  }));
}

export function totalesDeGanancia(filas: FilaDeGanancia[]) {
  const sumar = (de: (f: FilaDeGanancia) => number) => filas.reduce((s, f) => s + de(f), 0);
  return {
    ventasCentavos: sumar((f) => f.ventasCentavos),
    costoCentavos: sumar((f) => f.costoCentavos),
    gananciaCentavos: sumar((f) => f.gananciaCentavos),
    sinCosto: sumar((f) => f.sinCosto),
  };
}
