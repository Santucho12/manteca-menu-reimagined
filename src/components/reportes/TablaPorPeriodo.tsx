import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { etiquetaDe, type Escala, type Punto } from '@/lib/reportes/agrupar';
import { ticketPromedio } from '@/lib/reportes/ventas';
import { Celda, TablaDeDatos } from './TablaDeDatos';

type Props = { filas: Punto[]; escala: Escala; conVentas?: boolean };

const textoDe = (clave: string, escala: Escala) =>
  escala === 'dia' ? fechaParaMostrar(clave) : etiquetaDe(clave, escala);

/** Un renglon por dia o por mes; con ventas suma la cantidad y el ticket promedio. */
export function TablaPorPeriodo({ filas, escala, conVentas = false }: Props) {
  const titulos = [
    { texto: escala === 'dia' ? 'Día' : 'Mes' },
    ...(conVentas ? [{ texto: 'Ventas', der: true }] : []),
    { texto: 'Monto', der: true },
    ...(conVentas ? [{ texto: 'Ticket', der: true }] : []),
  ];
  return (
    <TablaDeDatos titulos={titulos}>
      {filas.map((p) => (
        <tr key={p.clave}>
          <Celda>
            <span className="font-medium whitespace-nowrap">{textoDe(p.clave, escala)}</span>
          </Celda>
          {conVentas ? <Celda der>{p.cantidad}</Celda> : null}
          <Celda der>
            <span className="font-bold whitespace-nowrap">{formatearPesos(p.montoCentavos)}</span>
          </Celda>
          {conVentas ? (
            <Celda der>{formatearPesos(ticketPromedio(p.montoCentavos, p.cantidad) ?? 0)}</Celda>
          ) : null}
        </tr>
      ))}
    </TablaDeDatos>
  );
}
