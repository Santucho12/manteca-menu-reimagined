type Rango = {
  desde: string;
  hasta: string;
  conCierre: string[];
  /** El dia del primer cierre del local: antes de eso el sistema no se usaba. */
  primero: string | null;
  hoy: string;
};

const UN_DIA = 86_400_000;
const aTiempo = (dia: string) => Date.parse(`${dia}T00:00:00Z`);
const aDia = (tiempo: number) => new Date(tiempo).toISOString().slice(0, 10);

/** Los dias del rango sin cierre, del mas nuevo al mas viejo. */
export function diasSinCierre({ desde, hasta, conCierre, primero, hoy }: Rango): string[] {
  if (!primero) return [];
  const inicio = aTiempo(desde > primero ? desde : primero);
  const cargados = new Set(conCierre);
  const faltan: string[] = [];
  for (let tiempo = aTiempo(hasta < hoy ? hasta : hoy); tiempo >= inicio; tiempo -= UN_DIA) {
    if (!cargados.has(aDia(tiempo))) faltan.push(aDia(tiempo));
  }
  return faltan;
}
