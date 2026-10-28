import { formatearPesosRedondeados } from '../plata';
import { variacion, type Variacion } from '../reportes/comparacion';
import { comparacionDelResultado, type ResultadoDelPeriodo } from '../reportes/resultado';
import { totalesDeVentas, type VentaDelDia } from '../reportes/ventas';

/** Lo que devuelve datosDelResultado para un periodo. */
type DelPeriodo = { ventas: VentaDelDia[]; resultado: ResultadoDelPeriodo; vacio: boolean };
export type NumeroDelMes = { etiqueta: string; valor: string; variacion: Variacion };

const ticketDe = (ventas: VentaDelDia[]) => totalesDeVentas(ventas).ticketCentavos;

function ticketDelMes(actual: DelPeriodo, anterior: DelPeriodo): NumeroDelMes {
  const ticket = ticketDe(actual.ventas) ?? 0;
  const ticketAnterior = anterior.ventas.length ? ticketDe(anterior.ventas) : null;
  return {
    etiqueta: 'Ticket promedio',
    valor: formatearPesosRedondeados(ticket),
    variacion: variacion(ticket, ticketAnterior),
  };
}

const numero = (etiqueta: string, valor: string, variacion: NumeroDelMes['variacion']) => ({
  etiqueta,
  valor,
  variacion,
});

/** Los cuatro numeros del mes contra los mismos dias del mes anterior. */
export function numerosDelMes(actual: DelPeriodo, anterior: DelPeriodo): NumeroDelMes[] {
  const { resultado } = actual;
  const c = comparacionDelResultado(resultado, anterior.vacio ? null : anterior.resultado);
  const final = resultado.resultadoCentavos;
  return [
    numero('Ventas', formatearPesosRedondeados(resultado.ventasCentavos), c.ventas),
    numero('Gastos', formatearPesosRedondeados(resultado.gastosCentavos), c.gastos),
    numero(
      'Balance',
      final === null ? 'Sin calcular' : formatearPesosRedondeados(final),
      c.resultado,
    ),
    ticketDelMes(actual, anterior),
  ];
}
