// El formato en-CA escribe AAAA-MM-DD, que es como se guarda un dia en la base.
const FORMATO_DIA = new Intl.DateTimeFormat('en-CA', {
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
  return FORMATO_DIA.format(instante);
}
