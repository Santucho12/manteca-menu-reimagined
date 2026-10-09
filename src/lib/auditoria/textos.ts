import { fechaParaMostrar } from '../gastos/pantalla';
import { formatearPesos } from '../plata';
import { ACCIONES, CAMPOS, DATOS, DE_PERSONA, OCULTAS, VALORES } from './diccionario';

export type Fila = Record<string, unknown>;
export type RegistroDeAuditoria = {
  id: number;
  fecha: string;
  tabla: string;
  registro_id: string;
  accion: string;
  usuario_id: string | null;
  antes: Fila | null;
  despues: Fila | null;
  motivo: string | null;
};
/** Nombre de cada categoria, proveedor, producto o persona que aparece en los registros. */
export type Nombres = Map<string, string>;
export type Cambio = { campo: string; antes: string | null; despues: string | null };

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const INSTANTE = /^\d{4}-\d{2}-\d{2}T/;
const HORA_EN_ARGENTINA = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export const datoDe = (tabla: string) => DATOS[tabla] ?? { modulo: 'Otros', dato: tabla };
export const nombreDeCampo = (columna: string) => CAMPOS[columna] ?? columna;
export const nombreDeAccion = (accion: string) => ACCIONES[accion] ?? accion;

/** Un instante como dia y hora en Argentina: 09/10/2026 12:30. */
export function fechaYHora(instante: string): string {
  const partes = new Map(
    HORA_EN_ARGENTINA.formatToParts(new Date(instante)).map((p) => [p.type, p.value]),
  );
  const dia = `${partes.get('day')}/${partes.get('month')}/${partes.get('year')}`;
  return `${dia} ${partes.get('hour')}:${partes.get('minute')}`;
}

function textoDe(columna: string, valor: unknown, nombres: Nombres): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (columna.endsWith('_centavos') && typeof valor === 'number') return formatearPesos(valor);
  if (columna.endsWith('_id') || DE_PERSONA.has(columna)) {
    return nombres.get(String(valor)) ?? 'Dato no disponible';
  }
  if (typeof valor !== 'string') return JSON.stringify(valor);
  if (DIA.test(valor)) return fechaParaMostrar(valor);
  if (INSTANTE.test(valor)) return fechaYHora(valor);
  return VALORES[valor] ?? valor;
}

/** Cada campo que se cargo o cambio, con su nombre y sus valores como se leen en pantalla. */
export function cambiosDe(registro: RegistroDeAuditoria, nombres: Nombres): Cambio[] {
  const despues = registro.despues ?? {};
  const antes = registro.antes;
  return Object.keys(despues)
    .filter((columna) => !OCULTAS.has(columna))
    .map((columna) => ({
      campo: nombreDeCampo(columna),
      antes: antes ? textoDe(columna, antes[columna], nombres) : null,
      despues: textoDe(columna, despues[columna], nombres),
    }));
}

const deFila = (registro: RegistroDeAuditoria, columna: string) => {
  const valor = registro.despues?.[columna] ?? registro.antes?.[columna];
  return typeof valor === 'string' ? valor : null;
};

const RUTAS: Record<string, (registro: RegistroDeAuditoria) => string | null> = {
  gastos: (r) => `/admin/gastos/${r.registro_id}`,
  gastos_recurrentes: (r) => `/admin/gastos/recurrentes/${r.registro_id}`,
  categorias_de_gasto: (r) => `/admin/gastos/categorias/${r.registro_id}`,
  proveedores: (r) => `/admin/proveedores/${r.registro_id}`,
  cierres_de_caja: (r) => `/admin/caja/cierres/${r.registro_id}`,
  retiros_de_caja: (r) => {
    const cierre = deFila(r, 'cierre_id');
    return cierre ? `/admin/caja/cierres/${cierre}` : '/admin/caja/control';
  },
  configuracion_de_caja: () => '/admin/caja/control',
  perfiles: () => '/admin/usuarios',
  productos: (r) => `/admin/menu/productos/${r.registro_id}`,
  precios: (r) => {
    const producto = deFila(r, 'producto_id');
    return producto ? `/admin/menu/productos/${producto}` : '/admin/menu';
  },
  categorias: (r) => `/admin/menu/categorias/${r.registro_id}`,
  presentaciones: (r) => {
    const categoria = deFila(r, 'categoria_id');
    return categoria ? `/admin/menu/categorias/${categoria}` : '/admin/menu';
  },
  aumentos: () => '/admin/menu',
};

/** Adonde ir para ver el dato: su pantalla, la que lo contiene, o ninguna. */
export function enlaceDe(registro: RegistroDeAuditoria): string | null {
  return RUTAS[registro.tabla]?.(registro) ?? null;
}
