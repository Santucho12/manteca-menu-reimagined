import { entero, type Azar } from './azar';

/** Proveedores inventados: no son los de Manteca. */
export const PROVEEDORES_DE_EJEMPLO = [
  { nombre: 'Molino San Jorge', que_compra: 'Harina y azúcar' },
  { nombre: 'Lácteos del Valle', que_compra: 'Manteca, leche y crema' },
  { nombre: 'Distribuidora La Dulce', que_compra: 'Dulce de leche y chocolate' },
  { nombre: 'Envases del Centro', que_compra: 'Cajas, bolsas y vasos' },
] as const;

export type GastoDeEjemplo = {
  fecha: string;
  categoria: string;
  proveedor: string | null;
  monto_centavos: number;
  descripcion: string;
  medio_de_pago: 'transferencia' | 'tarjeta';
};

const MIL_PESOS = 100000;

// Los fijos del mes, con su día y su monto en miles de pesos (inventados).
const FIJOS = [
  { dia: 1, categoria: 'Sueldos', descripcion: 'Sueldos del mes', miles: [2400, 2400] },
  { dia: 5, categoria: 'Alquiler', descripcion: 'Alquiler del local', miles: [850, 850] },
  { dia: 10, categoria: 'Servicios', descripcion: 'Luz', miles: [120, 180] },
  { dia: 12, categoria: 'Servicios', descripcion: 'Gas', miles: [60, 90] },
  { dia: 15, categoria: 'Servicios', descripcion: 'Internet', miles: [25, 25] },
  { dia: 20, categoria: 'Impuestos', descripcion: 'Ingresos brutos', miles: [150, 250] },
] as const;

// Lo que se le compra a cada proveedor y qué días de la semana (0 es domingo).
const COMPRAS = [
  { proveedor: 0, descripcion: 'Harina', dias: [2, 5], miles: [180, 300] },
  { proveedor: 1, descripcion: 'Manteca y crema', dias: [2, 5], miles: [150, 250] },
  { proveedor: 2, descripcion: 'Dulce de leche', dias: [5], miles: [60, 120] },
  { proveedor: 3, descripcion: 'Cajas y bolsas', dias: [1], miles: [40, 80] },
] as const;

const diaDelMes = (fecha: string) => Number(fecha.slice(8, 10));
const diaDeLaSemana = (fecha: string) => new Date(`${fecha}T12:00:00Z`).getUTCDay();
const montoEntre = (azar: Azar, [desde, hasta]: readonly [number, number]) =>
  entero(azar, desde, hasta) * MIL_PESOS;

function fijosDelDia(azar: Azar, fecha: string): GastoDeEjemplo[] {
  return FIJOS.filter((f) => f.dia === diaDelMes(fecha)).map((f) => ({
    fecha,
    categoria: f.categoria,
    proveedor: null,
    monto_centavos: montoEntre(azar, f.miles),
    descripcion: f.descripcion,
    medio_de_pago: 'transferencia',
  }));
}

function comprasDelDia(azar: Azar, fecha: string): GastoDeEjemplo[] {
  return COMPRAS.filter((c) => (c.dias as readonly number[]).includes(diaDeLaSemana(fecha))).map(
    (c) => ({
      fecha,
      categoria: 'Mercadería',
      proveedor: PROVEEDORES_DE_EJEMPLO[c.proveedor].nombre,
      monto_centavos: montoEntre(azar, c.miles),
      descripcion: c.descripcion,
      medio_de_pago: azar() < 0.8 ? 'transferencia' : 'tarjeta',
    }),
  );
}

/** Los gastos inventados del período: los fijos de cada mes y la mercadería de cada semana. */
export function gastosDelPeriodo(azar: Azar, dias: string[]): GastoDeEjemplo[] {
  return dias.flatMap((fecha) => [...fijosDelDia(azar, fecha), ...comprasDelDia(azar, fecha)]);
}
