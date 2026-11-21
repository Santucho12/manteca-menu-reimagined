/**
 * La cuenta del ticket: la docena variada y la venta por peso (pedido 102). La base hace la misma
 * al guardar (ventas_cuenta_del_mostrador); si cambia una, cambia la otra.
 */
export type RenglonParaLaCuenta = {
  clave: string;
  categoriaId: string;
  cantidad: number;
  precioCentavos: number;
  /** Cuántas unidades es la forma (Docena = 12), o null. */
  unidades: number | null;
  /** Lo que se pesó, en gramos, si la forma se vende por peso. */
  gramos: number | null;
  /** Los gramos de la forma en el menú (Por cuarto = 250), cuando se vende por peso. */
  gramosDeLaForma?: number | null;
  /** Si el precio es el de la categoría para todos: solo esos entran en la docena variada. */
  compartido: boolean;
};

/** Una forma con unidades y precio para todos; el nombre es el de la forma (Docena). */
export type Paquete = { unidades: number; precioCentavos: number; nombre?: string };
export type Paquetes = Record<string, Paquete[]>;
export type Variada = {
  categoriaId: string;
  unidades: number;
  antesCentavos: number;
  ahoraCentavos: number;
  /** Cómo se cobró: "4 × Docena · 4 × Unidad". */
  desglose: string;
  /** Las formas con que se cobró, para mostrarlas una por renglón. */
  paquetes: PaqueteUsado[];
};
export type Cuenta = {
  renglones: { clave: string; subtotalCentavos: number }[];
  totalCentavos: number;
  variadas: Variada[];
};

type FormaParaPaquete = {
  categoriaId: string;
  unidades: number | null;
  precioCentavos: number;
  compartido: boolean;
  nombre?: string;
};

/** Las formas con unidades y precio para todos de cada categoría, de la más grande a la más chica. */
export function armarPaquetes(formas: FormaParaPaquete[]): Paquetes {
  const paquetes: Paquetes = {};
  for (const f of formas) {
    if (!f.compartido || !f.unidades) continue;
    const lista = (paquetes[f.categoriaId] ??= []);
    if (!lista.some((p) => p.unidades === f.unidades))
      lista.push({ unidades: f.unidades, precioCentavos: f.precioCentavos, nombre: f.nombre });
  }
  for (const lista of Object.values(paquetes)) lista.sort((a, b) => b.unidades - a.unidades);
  return paquetes;
}

/** Lo que sale el renglón solo: por peso, en proporción a los gramos; si no, precio por cantidad. */
export function subtotalSolo(r: RenglonParaLaCuenta): number {
  if (r.gramos && r.gramosDeLaForma)
    return Math.round((r.precioCentavos * r.gramos) / r.gramosDeLaForma);
  return r.precioCentavos * r.cantidad;
}

/** Cada paquete entra las veces que puede, del más grande al más chico (12, 6, 1). */
export function precioEnPaquetes(unidades: number, paquetes: Paquete[]): number | null {
  let resto = unidades;
  let total = 0;
  for (const p of paquetes) {
    total += Math.floor(resto / p.unidades) * p.precioCentavos;
    resto %= p.unidades;
  }
  return resto === 0 ? total : null;
}

export type PaqueteUsado = { nombre: string; veces: number; subtotalCentavos: number };

/** Cada forma que entra, del más grande al más chico, con cuántas veces y lo que suma. */
export function paquetesUsados(unidades: number, paquetes: Paquete[]): PaqueteUsado[] {
  let resto = unidades;
  const usados: PaqueteUsado[] = [];
  for (const p of paquetes) {
    const veces = Math.floor(resto / p.unidades);
    resto %= p.unidades;
    const nombre = p.nombre ?? `${p.unidades} u.`;
    if (veces > 0) usados.push({ nombre, veces, subtotalCentavos: veces * p.precioCentavos });
  }
  return usados;
}

/** Cuántas de cada forma entran, como se lee en el ticket: "4 × Docena · 4 × Unidad". */
export const desgloseEnPaquetes = (unidades: number, paquetes: Paquete[]): string =>
  paquetesUsados(unidades, paquetes)
    .map((p) => `${p.veces} × ${p.nombre}`)
    .join(' · ');

/** Reparte el total entre los renglones según lo que salía cada uno; el último se lleva el resto. */
function repartir(subtotales: number[], total: number): number[] {
  const antes = subtotales.reduce((s, x) => s + x, 0);
  const partes = subtotales.map((x) => Math.floor((total * x) / antes));
  partes[partes.length - 1]! += total - partes.reduce((s, x) => s + x, 0);
  return partes;
}

const entraEnLaVariada = (r: RenglonParaLaCuenta) => r.compartido && !!r.unidades && !r.gramos;

function variadaDe(categoriaId: string, grupo: RenglonParaLaCuenta[], paquetes: Paquetes) {
  const unidades = grupo.reduce((s, r) => s + r.cantidad * r.unidades!, 0);
  const antesCentavos = grupo.reduce((s, r) => s + subtotalSolo(r), 0);
  const ahoraCentavos = precioEnPaquetes(unidades, paquetes[categoriaId] ?? []);
  if (ahoraCentavos === null || ahoraCentavos >= antesCentavos) return null;
  const lista = paquetes[categoriaId]!;
  const desglose = desgloseEnPaquetes(unidades, lista);
  const usados = paquetesUsados(unidades, lista);
  return { categoriaId, unidades, antesCentavos, ahoraCentavos, desglose, paquetes: usados };
}

/** El total del ticket, con la docena variada de cada categoría y lo pesado a su precio. */
export function cuentaDelTicket(ticket: RenglonParaLaCuenta[], paquetes: Paquetes): Cuenta {
  const subtotales = new Map(ticket.map((r) => [r.clave, subtotalSolo(r)]));
  const variadas: Variada[] = [];
  for (const categoriaId of new Set(ticket.filter(entraEnLaVariada).map((r) => r.categoriaId))) {
    const grupo = ticket.filter((r) => entraEnLaVariada(r) && r.categoriaId === categoriaId);
    const variada = variadaDe(categoriaId, grupo, paquetes);
    if (!variada) continue;
    variadas.push(variada);
    const partes = repartir(grupo.map(subtotalSolo), variada.ahoraCentavos);
    grupo.forEach((r, i) => subtotales.set(r.clave, partes[i]!));
  }
  const renglones = ticket.map((r) => ({
    clave: r.clave,
    subtotalCentavos: subtotales.get(r.clave)!,
  }));
  const totalCentavos = renglones.reduce((s, r) => s + r.subtotalCentavos, 0);
  return { renglones, totalCentavos, variadas };
}
