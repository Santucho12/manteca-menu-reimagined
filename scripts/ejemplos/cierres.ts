import { MEDIOS, type Medio } from '../../src/lib/caja/resultado';
import { elegir, entero, type Azar } from './azar';
import type { VentaDeEjemplo } from './ventas';

/** Con cuánto arranca y queda la caja cada día: $20.000 (inventado). */
export const FONDO_CENTAVOS = 2000000;
const DIEZ_MIL = 1000000;
const RETIRA_DESDE = 6000000;

type GastoDeCaja = { monto_centavos: number; descripcion: string };

/** Lo que manda la pantalla de Caja al guardar: va tal cual a cierres_guardar. */
export type CierreDeEjemplo = {
  fecha: string;
  fondo_inicial_centavos: number;
  efectivo_centavos: number;
  credito_centavos: number;
  debito_centavos: number;
  qr_centavos: number;
  transferencia_centavos: number;
  queda_en_caja_centavos: number;
  comentario: string | null;
  retiros: { monto_centavos: number; quien: string }[];
  gastos: GastoDeCaja[];
};

export function vendidoPorMedio(ventas: VentaDeEjemplo[]): Record<Medio, number> {
  const vendido = Object.fromEntries(MEDIOS.map((m) => [m, 0])) as Record<Medio, number>;
  for (const pago of ventas.flatMap((v) => v.pagos)) vendido[pago.medio] += pago.montoCentavos;
  return vendido;
}

// El dueño se lleva de a diez mil lo que pasa del fondo, si hay mucho.
function retirosDe(enLaCaja: number) {
  if (enLaCaja <= RETIRA_DESDE) return [];
  return [
    {
      monto_centavos: Math.floor((enLaCaja - FONDO_CENTAVOS) / DIEZ_MIL) * DIEZ_MIL,
      quien: 'Dueño',
    },
  ];
}

// El fondo más lo vendido en efectivo, menos los gastos pagados con la caja y lo retirado.
function efectivoDelDia(vendidoEnEfectivo: number, gastos: GastoDeCaja[]) {
  const enLaCaja =
    FONDO_CENTAVOS + vendidoEnEfectivo - gastos.reduce((s, g) => s + g.monto_centavos, 0);
  const retiros = retirosDe(enLaCaja);
  return { retiros, efectivo: enLaCaja - retiros.reduce((s, r) => s + r.monto_centavos, 0) };
}

const mediosDeclarados = (vendido: Record<Medio, number>) => ({
  credito_centavos: vendido.credito,
  debito_centavos: vendido.debito,
  qr_centavos: vendido.qr,
  transferencia_centavos: vendido.transferencia,
});

/** El cierre que cierra justo: cada medio declara lo que se vendió con él. */
export function cierreCuadrado(
  fecha: string,
  ventas: VentaDeEjemplo[],
  gastos: GastoDeCaja[],
): CierreDeEjemplo {
  const vendido = vendidoPorMedio(ventas);
  const { retiros, efectivo } = efectivoDelDia(vendido.efectivo, gastos);
  return {
    fecha,
    fondo_inicial_centavos: FONDO_CENTAVOS,
    efectivo_centavos: efectivo,
    ...mediosDeclarados(vendido),
    queda_en_caja_centavos: Math.min(FONDO_CENTAVOS, efectivo),
    comentario: null,
    retiros,
    gastos,
  };
}

const GASTOS_DE_CAJA = ['Hielo', 'Artículos de limpieza', 'Bolsas', 'Servilletas'];

function gastosAlAzar(azar: Azar): GastoDeCaja[] {
  if (azar() >= 0.3) return [];
  const descripcion = GASTOS_DE_CAJA[entero(azar, 0, GASTOS_DE_CAJA.length - 1)]!;
  return [{ monto_centavos: entero(azar, 3, 15) * 100000, descripcion }];
}

// En centavos: casi siempre justo, a veces unos pesos de cambio, de vez en cuando un faltante.
function diferenciaAlAzar(azar: Azar): number {
  return elegir(azar, [
    { valor: 0, peso: 80 },
    { valor: entero(azar, -4, 4) * 10000, peso: 12 },
    { valor: entero(azar, -80, 30) * 10000, peso: 8 },
  ]);
}

/** El cierre inventado de un día, contra las ventas de ese día. */
export function cierreDelDia(azar: Azar, fecha: string, ventas: VentaDeEjemplo[]): CierreDeEjemplo {
  const cuadrado = cierreCuadrado(fecha, ventas, gastosAlAzar(azar));
  const efectivo = Math.max(0, cuadrado.efectivo_centavos + diferenciaAlAzar(azar));
  const queda = Math.min(cuadrado.queda_en_caja_centavos, efectivo);
  return { ...cuadrado, efectivo_centavos: efectivo, queda_en_caja_centavos: queda };
}
