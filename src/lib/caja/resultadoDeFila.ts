import { resultadoDelCierre, type ResultadoDelCierre } from './resultado';

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
};

/** El estado y la diferencia de cada medio de un cierre, contra las ventas de su dia. */
export function resultadoDeFila(fila: FilaConVentas): ResultadoDelCierre {
  return resultadoDelCierre(
    {
      fondoInicialCentavos: fila.fondo_inicial_centavos,
      retirosCentavos: fila.retiros_centavos,
      gastosCentavos: fila.gastos_centavos,
      medios: {
        efectivo: fila.efectivo_centavos,
        credito: fila.credito_centavos,
        debito: fila.debito_centavos,
        qr: fila.qr_centavos,
        transferencia: fila.transferencia_centavos,
      },
    },
    {
      efectivo: fila.ventas_efectivo_centavos,
      credito: fila.ventas_credito_centavos,
      debito: fila.ventas_debito_centavos,
      qr: fila.ventas_qr_centavos,
      transferencia: fila.ventas_transferencia_centavos,
    },
    fila.tolerancia_centavos,
  );
}
