/** Una fecha de la base (2026-11-20) como se lee acá: 20/11/2026. */
export function fechaDiaMesAnio(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : 'dd/mm/aaaa';
}
