import type { Medio } from '../../src/lib/caja/resultado';
import { elegir, entero, type Azar } from './azar';

/** Un producto en una forma de venta, con su precio del menú. */
export type FormaDeEjemplo = {
  productoId: string;
  presentacionId: string;
  descripcion: string;
  precioCentavos: number;
};
export type RenglonDeEjemplo = FormaDeEjemplo & { cantidad: number };
export type PagoDeEjemplo = { medio: Medio; montoCentavos: number };
export type VentaDeEjemplo = {
  fecha: string;
  cerradaEn: string;
  renglones: RenglonDeEjemplo[];
  pagos: PagoDeEjemplo[];
  totalCentavos: number;
};

// Inventado: cómo podría repartirse el cobro en un mostrador.
const MEDIOS: { valor: Medio; peso: number }[] = [
  { valor: 'efectivo', peso: 40 },
  { valor: 'debito', peso: 25 },
  { valor: 'qr', peso: 20 },
  { valor: 'credito', peso: 10 },
  { valor: 'transferencia', peso: 5 },
];
const MIL_PESOS = 100000;

const esFinDeSemana = (dia: string) => [0, 6].includes(new Date(`${dia}T12:00:00Z`).getUTCDay());

function renglonesAlAzar(azar: Azar, formas: FormaDeEjemplo[]): RenglonDeEjemplo[] {
  return Array.from({ length: entero(azar, 1, 3) }, () => ({
    ...formas[entero(azar, 0, formas.length - 1)]!,
    cantidad: entero(azar, 1, 2),
  }));
}

// Casi siempre un medio; a veces una parte en otro, redondeada a mil pesos.
function pagosAlAzar(azar: Azar, totalCentavos: number): PagoDeEjemplo[] {
  const medio = elegir(azar, MEDIOS);
  const dos = totalCentavos >= 4 * MIL_PESOS && azar() < 0.1;
  const primero = Math.round((totalCentavos * entero(azar, 3, 7)) / 10 / MIL_PESOS) * MIL_PESOS;
  if (!dos || primero <= 0 || primero >= totalCentavos)
    return [{ medio, montoCentavos: totalCentavos }];
  const otro = elegir(
    azar,
    MEDIOS.filter((m) => m.valor !== medio),
  );
  return [
    { medio, montoCentavos: primero },
    { medio: otro, montoCentavos: totalCentavos - primero },
  ];
}

// Entre las 8 y las 20 de Argentina (UTC-3), guardado en UTC.
function horaAlAzar(azar: Azar, dia: string): string {
  const minutos = entero(azar, 8 * 60, 20 * 60 - 1);
  return new Date(Date.parse(`${dia}T00:00:00Z`) + (minutos + 180) * 60000).toISOString();
}

function ventaAlAzar(azar: Azar, dia: string, formas: FormaDeEjemplo[]): VentaDeEjemplo {
  const renglones = renglonesAlAzar(azar, formas);
  const totalCentavos = renglones.reduce((s, r) => s + r.precioCentavos * r.cantidad, 0);
  const cerradaEn = horaAlAzar(azar, dia);
  return {
    fecha: dia,
    cerradaEn,
    renglones,
    pagos: pagosAlAzar(azar, totalCentavos),
    totalCentavos,
  };
}

/** Las ventas inventadas de un día del mostrador, en el orden en que se cobraron. */
export function ventasDelDia(azar: Azar, dia: string, formas: FormaDeEjemplo[]): VentaDeEjemplo[] {
  const cantidad = esFinDeSemana(dia) ? entero(azar, 75, 100) : entero(azar, 40, 70);
  return Array.from({ length: cantidad }, () => ventaAlAzar(azar, dia, formas)).sort((a, b) =>
    a.cerradaEn.localeCompare(b.cerradaEn),
  );
}

/** Una venta cargada a mano: no pasó por el mostrador ni por la caja. */
export type VentaAManoDeEjemplo = VentaDeEjemplo & { tipo: 'Encargo' | 'Venta a comercios' };

type Tipo = VentaAManoDeEjemplo['tipo'];

function ventaAMano(dia: string, cerradaEn: string, renglon: RenglonDeEjemplo, tipo: Tipo) {
  const totalCentavos = renglon.precioCentavos * renglon.cantidad;
  const pagos = [{ medio: 'transferencia' as const, montoCentavos: totalCentavos }];
  return { fecha: dia, cerradaEn, renglones: [renglon], pagos, totalCentavos, tipo };
}

/** A veces, un encargo o una venta a comercios del día, de varias docenas, por transferencia. */
export function ventasAManoDelDia(
  azar: Azar,
  dia: string,
  formas: FormaDeEjemplo[],
): VentaAManoDeEjemplo[] {
  if (azar() >= 0.4) return [];
  const forma = formas[entero(azar, 0, formas.length - 1)]!;
  const renglon = { ...forma, cantidad: entero(azar, 4, 12) };
  const tipo: Tipo = azar() < 0.6 ? 'Encargo' : 'Venta a comercios';
  return [ventaAMano(dia, horaAlAzar(azar, dia), renglon, tipo)];
}
