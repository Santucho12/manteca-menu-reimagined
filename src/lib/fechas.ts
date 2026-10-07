const PARTES_DEL_DIA = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Devuelve el dia calendario en Argentina de un instante, como AAAA-MM-DD. */
export function diaEnArgentina(instante: Date): string {
  if (Number.isNaN(instante.getTime())) {
    throw new Error('La fecha no es válida');
  }
  // Se arma con las partes y no con el texto formateado: el orden y los separadores de ese
  // texto dependen del idioma y del motor (Node o el navegador).
  const partes = new Map(PARTES_DEL_DIA.formatToParts(instante).map((p) => [p.type, p.value]));
  return `${partes.get('year')}-${partes.get('month')}-${partes.get('day')}`;
}
