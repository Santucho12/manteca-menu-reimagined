import { clienteSecretoDePruebas } from './clientes';
import { idDelLocalPrincipal } from './locales';
import { borrarVentas, sembrarVentaConPago } from './ventas-de-prueba';

export type Historial = { ventas: string[]; gastos: string[] };

/** El primer dia de este mes y de los tres anteriores, de hoy (AAAA-MM-DD) para atras. */
export function primerosDiasDeLosMeses(hoy: string, meses = 4): string[] {
  const [anio, mes] = hoy.split('-').map(Number) as [number, number];
  return Array.from({ length: meses }, (_, atras) => {
    const fecha = new Date(Date.UTC(anio, mes - 1 - atras, 1));
    return fecha.toISOString().slice(0, 10);
  });
}

async function idDeAlquiler(local: string): Promise<string> {
  const { data } = await clienteSecretoDePruebas()
    .from('categorias_de_gasto')
    .select('id')
    .eq('local_id', local)
    .eq('nombre', 'Alquiler')
    .single();
  return data!.id;
}

async function sembrarGastoDelMes(local: string, categoria: string, fecha: string, monto: number) {
  const fila = {
    local_id: local,
    fecha,
    categoria_id: categoria,
    monto_centavos: monto,
    medio_de_pago: 'transferencia' as const,
  };
  const { data } = await clienteSecretoDePruebas()
    .from('gastos')
    .insert(fila)
    .select('id')
    .single();
  return data!.id;
}

/**
 * Varios meses con una venta y un gasto cada uno, en el local de las pruebas, con montos que
 * crecen hacia hoy: Inicio dibuja sus tres series por mes y la variacion contra el mes
 * anterior no da cero.
 */
export async function sembrarHistorial(hoy: string, meses = 4): Promise<Historial> {
  const local = await idDelLocalPrincipal(clienteSecretoDePruebas());
  const categoria = await idDeAlquiler(local);
  const historial: Historial = { ventas: [], gastos: [] };
  for (const [atras, fecha] of primerosDiasDeLosMeses(hoy, meses).entries()) {
    const venta = { fecha, medio: 'efectivo' as const, centavos: 600_000 - atras * 50_000 };
    historial.ventas.push(await sembrarVentaConPago(venta));
    const gasto = 200_000 - atras * 20_000;
    historial.gastos.push(await sembrarGastoDelMes(local, categoria, fecha, gasto));
  }
  return historial;
}

export async function borrarHistorial({ ventas, gastos }: Historial): Promise<void> {
  await borrarVentas(ventas);
  const secreto = clienteSecretoDePruebas();
  await secreto.from('gastos').delete().in('id', gastos);
  await secreto.from('auditoria').delete().in('registro_id', gastos);
}
