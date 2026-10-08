import type { Resultado } from '../resultado';
import {
  filtroDeEstado,
  numeroDePagina,
  textoDeBusqueda,
  unValor,
  type AccionDeUsuario,
  type FilaDeUsuario,
  type FiltrosDeLista,
} from './presentacion';

export type ParametrosDeUrl = Record<string, string | string[] | undefined>;
export type CuentaDeLaLista = Pick<FilaDeUsuario, 'id' | 'nombre' | 'email'>;
export type AccionConConfirmacion = 'rechazar' | 'desactivar' | 'resetear';
export type Panel =
  | { tipo: 'botones' }
  | { tipo: 'confirmar'; accion: AccionConConfirmacion }
  | { tipo: 'corregir' }
  | { tipo: 'temporal'; contrasena: string };

const PREGUNTAS: Record<AccionConConfirmacion, (nombre: string) => string> = {
  rechazar: (nombre) =>
    `¿Rechazar a ${nombre}? No va a poder entrar ni volver a registrarse con ese email.`,
  desactivar: (nombre) => `¿Desactivar a ${nombre}? Pierde el acceso en el momento.`,
  resetear: (nombre) => `¿Resetear la contraseña de ${nombre}? La que tiene deja de servir.`,
};

export const CONFIRMAR: Record<
  AccionConConfirmacion,
  { texto: string; variante: 'default' | 'destructive' }
> = {
  rechazar: { texto: 'Sí, rechazar', variante: 'destructive' },
  desactivar: { texto: 'Sí, desactivar', variante: 'destructive' },
  resetear: { texto: 'Sí, resetear', variante: 'default' },
};

export function filtrosDeLaUrl(parametros: ParametrosDeUrl): FiltrosDeLista {
  return {
    busqueda: textoDeBusqueda(unValor(parametros.q)),
    estado: filtroDeEstado(unValor(parametros.estado)),
    pagina: numeroDePagina(unValor(parametros.pagina)),
  };
}

export function preguntaDe(accion: AccionConConfirmacion, nombre: string): string {
  return PREGUNTAS[accion](nombre);
}

export function textoDeTemporal(nombre: string): string {
  return `Pasale esta contraseña a ${nombre}. Se la vamos a pedir cambiar apenas entre. No la vas a poder ver de nuevo.`;
}

/** Al tocar un boton: corregir abre el formulario; rechazar, desactivar y resetear piden confirmacion. */
export function panelAlElegir(accion: AccionDeUsuario): Panel {
  if (accion === 'corregir') return { tipo: 'corregir' };
  if (accion === 'rechazar' || accion === 'desactivar' || accion === 'resetear') {
    return { tipo: 'confirmar', accion };
  }
  return { tipo: 'botones' };
}

/** Despues de una accion: si trajo una contraseña temporal, se muestra; si no, vuelven los botones. */
export function siguientePanel(resultado: Resultado<{ temporal?: string } | undefined>): Panel {
  const temporal = resultado.ok ? resultado.datos?.temporal : undefined;
  return temporal ? { tipo: 'temporal', contrasena: temporal } : { tipo: 'botones' };
}
