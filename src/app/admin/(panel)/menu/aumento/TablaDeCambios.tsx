import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CambioDePrecio } from '@/lib/menu/aumento';
import { formatearPesosEnteros } from '@/lib/plata';

export function TablaDeCambios({ cambios }: { cambios: CambioDePrecio[] }) {
  if (cambios.length === 0)
    return <p className="text-muted-foreground">No hay precios para aumentar en ese alcance.</p>;
  return (
    <Table aria-label="Cambios de precio">
      <TableHeader>
        <TableRow>
          <TableHead>Qué</TableHead>
          <TableHead>Presentación</TableHead>
          <TableHead>Ahora</TableHead>
          <TableHead>Queda</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cambios.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              {c.producto ?? `Precio compartido de ${c.categoria}`}{' '}
              {c.oculto ? <Badge variant="outline">Oculto</Badge> : null}
            </TableCell>
            <TableCell>{c.presentacion}</TableCell>
            <TableCell>{formatearPesosEnteros(c.montoCentavos)}</TableCell>
            <TableCell className="font-medium">{formatearPesosEnteros(c.nuevoCentavos)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
