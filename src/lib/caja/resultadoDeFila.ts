import { MEDIOS, resultadoDelCierre, type ResultadoDelCierre } from './resultado';

/** Lo que devuelve cierres_con_resultado: lo declarado y lo vendido ese dia por medio. */
export type FilaConVentas = {
  fondo_inicial_centavos: number;
  efectivo_centavos: number;
  credito_centavos: number;
  debito_centavos: number;
  qr_centavos: number;
  transferencia_centavos: number;
  retiros_centavos: number;
  gastos_centavos: number;
  ventas_efectivo_centavos: number;
  ventas_credito_centavos: number;
  ventas_debito_centavos: number;
  ventas_qr_centavos: number;
  ventas_transferencia_centavos: number;
  tolerancia_centavos: number;
  /** Si el dia ya tiene ventas de Fudo cargadas (con el Excel, llegan dias despues). */
  ventas_cargadas: boolean;
};

const declaradoDe = (f: FilaConVentas) => ({
  fondoInicialCentavos: f.fondo_inicial_centavos,
  retirosCentavos: f.retiros_centavos,
  gastosCentavos: f.gastos_centavos,
  medios: {
    efectivo: f.efectivo_centavos,
    credito: f.credito_centavos,
    debito: f.debito_centavos,
    qr: f.qr_centavos,
    transferencia: f.transferencia_centavos,
  },
});

const vendidoDe = (f: FilaConVentas) => ({
  efectivo: f.ventas_efectivo_centavos,
  credito: f.ventas_credito_centavos,
  debito: f.ventas_debito_centavos,
  qr: f.ventas_qr_centavos,
  transferencia: f.ventas_transferencia_centavos,
});

// Sin las ventas del dia no hay esperado: se muestra lo declarado, sin faltantes ni sobrantes.
function esperandoVentas(fila: FilaConVentas): ResultadoDelCierre {
  const { medios } = declaradoDe(fila);
  return {
    estado: 'esperando_ventas',
    medios: MEDIOS.map((medio) => ({
      medio,
      declaradoCentavos: medios[medio],
      esperadoCentavos: 0,
      diferenciaCentavos: 0,
    })),
    diferenciaTotalCentavos: 0,
  };
}

/** El estado y la diferencia de cada medio de un cierre, contra las ventas de su dia. */
export function resultadoDeFila(fila: FilaConVentas): ResultadoDelCierre {
  if (!fila.ventas_cargadas) return esperandoVentas(fila);
  return resultadoDelCierre(declaradoDe(fila), vendidoDe(fila), fila.tolerancia_centavos);
}

/** La diferencia total, o null si todavia no se sabe porque faltan las ventas del dia. */
export const diferenciaConocida = (fila: FilaConVentas): number | null =>
  fila.ventas_cargadas ? resultadoDeFila(fila).diferenciaTotalCentavos : null;
