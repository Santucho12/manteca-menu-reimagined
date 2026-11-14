type Rango = {
  desde: string;
  hasta: string;
  conCierre: string[];
  /** Los dias que el admin marco como que el local no abrio: no estan pendientes. */
  sinAbrir?: string[];
  /** El dia del primer cierre del local: antes de eso el sistema no se usaba. */
  primero: string | null;
  hoy: string;
};

const UN_DIA = 86_400_000;
const aTiempo = (dia: string) => Date.parse(`${dia}T00:00:00Z`);
const aDia = (tiempo: number) => new Date(tiempo).toISOString().slice(0, 10);

/** Los dias del rango sin cierre, del mas nuevo al mas viejo. */
export function diasSinCierre({
  desde,
  hasta,
  conCierre,
  sinAbrir = [],
  primero,
  hoy,
}: Rango): string[] {
  if (!primero) return [];
  const inicio = aTiempo(desde > primero ? desde : primero);
  const resueltos = new Set([...conCierre, ...sinAbrir]);
  const faltan: string[] = [];
  for (let tiempo = aTiempo(hasta < hoy ? hasta : hoy); tiempo >= inicio; tiempo -= UN_DIA) {
    if (!resueltos.has(aDia(tiempo))) faltan.push(aDia(tiempo));
  }
  return faltan;
}

/** Los dias marcados como que el local no abrio, del mas nuevo al mas viejo, sin los que tienen cierre. */
export function diasQueNoAbrio({
  conCierre,
  sinAbrir,
}: {
  conCierre: string[];
  sinAbrir: string[];
}): string[] {
  const cargados = new Set(conCierre);
  return sinAbrir.filter((dia) => !cargados.has(dia)).sort((a, b) => b.localeCompare(a));
}
