import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { etiquetaDe, type Escala, type Punto } from '@/lib/reportes/agrupar';
import { ticketPromedio } from '@/lib/reportes/ventas';

type Props = { filas: Punto[]; escala: Escala; conVentas?: boolean };

const textoDe = (clave: string, escala: Escala) =>
  escala === 'dia' ? fechaParaMostrar(clave) : etiquetaDe(clave, escala);

/** Un renglon por dia o por mes; con ventas suma la cantidad y el ticket promedio. */
export function TablaPorPeriodo({ filas, escala, conVentas = false }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{escala === 'dia' ? 'Día' : 'Mes'}</TableHead>
          {conVentas ? <TableHead className="text-right">Ventas</TableHead> : null}
          <TableHead className="text-right">Monto</TableHead>
          {conVentas ? <TableHead className="text-right">Ticket</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((p) => (
          <TableRow key={p.clave}>
            <TableCell>{textoDe(p.clave, escala)}</TableCell>
            {conVentas ? <TableCell className="text-right">{p.cantidad}</TableCell> : null}
            <TableCell className="text-right">{formatearPesos(p.montoCentavos)}</TableCell>
            {conVentas ? (
              <TableCell className="text-right">
                {formatearPesos(ticketPromedio(p.montoCentavos, p.cantidad) ?? 0)}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
