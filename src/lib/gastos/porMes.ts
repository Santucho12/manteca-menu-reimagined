export type GrupoDeMes<T> = { mes: string; items: T[]; totalCentavos: number };

/** Lo que viene, junto por mes (AAAA-MM) y en el orden en que llega; cada mes dice cuanto suma. */
export function agruparPorMes<T extends { fecha: string; montoCentavos: number }>(
  items: T[],
): GrupoDeMes<T>[] {
  const grupos: GrupoDeMes<T>[] = [];
  for (const item of items) {
    const mes = item.fecha.slice(0, 7);
    const ultimo = grupos.at(-1);
    if (ultimo?.mes === mes) {
      ultimo.items.push(item);
      ultimo.totalCentavos += item.montoCentavos;
    } else {
      grupos.push({ mes, items: [item], totalCentavos: item.montoCentavos });
    }
  }
  return grupos;
}
