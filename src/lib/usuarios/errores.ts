export const MENSAJES = {
  credenciales: 'El email o la contraseña no coinciden. Revisalos e intentá de nuevo.',
  desactivada: 'Tu cuenta está desactivada. Hablá con el administrador.',
  emailExistente: 'Ya hay una cuenta con ese email.',
  contrasenaCorta: 'La contraseña tiene que tener al menos 6 caracteres.',
  mismaContrasena: 'La contraseña nueva tiene que ser distinta de la anterior.',
  demasiadosIntentos: 'Hubo demasiados intentos seguidos. Esperá un minuto y probá de nuevo.',
  noASiMismo: 'No podés cambiar tu propio rol ni desactivarte.',
  ultimoAdmin: 'Tiene que quedar al menos un administrador activo.',
  emailSoloAdmin: 'El email de una cuenta lo cambia un administrador.',
  actualNoCoincide: 'Tu contraseña actual no coincide.',
  sinPermiso: 'No tenés permiso para hacer esto.',
  cuentaNoEncontrada: 'No encontramos esa cuenta.',
  propiaContrasena: 'Tu propia contraseña la cambiás desde Mi cuenta.',
  sesionVencida: 'Tu sesión venció. Volvé a ingresar.',
  datosInvalidos: 'Revisá los datos e intentá de nuevo.',
  generico: 'No pudimos hacerlo. Revisá los datos e intentá de nuevo.',
} as const;

const POR_CODIGO: Record<string, string> = {
  invalid_credentials: MENSAJES.credenciales,
  user_banned: MENSAJES.desactivada,
  email_exists: MENSAJES.emailExistente,
  user_already_exists: MENSAJES.emailExistente,
  '23505': MENSAJES.emailExistente,
  weak_password: MENSAJES.contrasenaCorta,
  same_password: MENSAJES.mismaContrasena,
  over_request_rate_limit: MENSAJES.demasiadosIntentos,
  PM001: MENSAJES.noASiMismo,
  PM002: MENSAJES.ultimoAdmin,
  PM003: MENSAJES.emailSoloAdmin,
};

/** Traduce un error de Supabase (de Auth o de la base) a un mensaje para la persona. */
export function mensajeDeError(error: { code?: string | null } | null | undefined): string {
  return POR_CODIGO[error?.code ?? ''] ?? MENSAJES.generico;
}
