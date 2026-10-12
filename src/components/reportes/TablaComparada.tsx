import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearPesos } from '@/lib/plata';
import { textoDeVariacion, type Variacion } from '@/lib/reportes/comparacion';

export type FilaComparada = {
  clave: string;
  nombre: ReactNode;
  cantidad?: number;
  montoCentavos: number;
  variacion: Variacion;
};
type Props = { titulo: string; filas: FilaComparada[]; tituloDeCantidad?: string };

/** Cada fila con su monto y su variacion contra la misma fila del otro periodo. */
export function TablaComparada({ titulo, filas, tituloDeCantidad }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{titulo}</TableHead>
          {tituloDeCantidad ? (
            <TableHead className="text-right">{tituloDeCantidad}</TableHead>
          ) : null}
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">Variación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((f) => (
          <TableRow key={f.clave}>
            <TableCell className="align-top whitespace-normal">{f.nombre}</TableCell>
            {tituloDeCantidad ? (
              <TableCell className="text-right align-top">{f.cantidad}</TableCell>
            ) : null}
            <TableCell className="text-right align-top">
              {formatearPesos(f.montoCentavos)}
            </TableCell>
            <TableCell className="text-muted-foreground text-right align-top text-sm">
              {textoDeVariacion(f.variacion)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
