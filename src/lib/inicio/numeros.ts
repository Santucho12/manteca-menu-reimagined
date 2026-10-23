import { formatearPesos } from '../plata';
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
    valor: formatearPesos(ticket),
    variacion: variacion(ticket, ticketAnterior),
  };
}

/** Los cuatro numeros del mes contra los mismos dias del mes anterior. */
export function numerosDelMes(actual: DelPeriodo, anterior: DelPeriodo): NumeroDelMes[] {
  const { resultado } = actual;
  const c = comparacionDelResultado(resultado, anterior.vacio ? null : anterior.resultado);
  const final = resultado.resultadoCentavos;
  return [
    { etiqueta: 'Ventas', valor: formatearPesos(resultado.ventasCentavos), variacion: c.ventas },
    { etiqueta: 'Gastos', valor: formatearPesos(resultado.gastosCentavos), variacion: c.gastos },
    {
      etiqueta: 'Balance',
      valor: final === null ? 'Sin calcular' : formatearPesos(final),
      variacion: c.resultado,
    },
    ticketDelMes(actual, anterior),
  ];
}
