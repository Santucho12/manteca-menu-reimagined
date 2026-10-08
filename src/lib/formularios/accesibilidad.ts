/** El id del mensaje de error de un campo. */
export function idDelError(id: string): string {
  return `${id}-error`;
}

/** Lo que necesita un campo para que el lector de pantalla anuncie su error. */
export function atributosDeError(id: string, error: string | undefined) {
  return error ? { 'aria-invalid': true as const, 'aria-describedby': idDelError(id) } : {};
}

/** El boton que muestra u oculta una contraseña dice cual: puede haber dos en la pantalla. */
export function nombreDelBotonDeContrasena(etiqueta: string, visible: boolean): string {
  return `${visible ? 'Ocultar' : 'Mostrar'} ${etiqueta.toLowerCase()}`;
}
