import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearPesos } from '@/lib/plata';
import { SeccionGuia } from './SeccionGuia';

function Botones() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button>Guardar</Button>
        <Button variant="secondary">Cancelar</Button>
        <Button variant="outline">Ver detalle</Button>
        <Button variant="destructive">Anular</Button>
        <Button disabled>No disponible</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Chico</Button>
        <Button>Normal</Button>
        <Button size="lg">Grande</Button>
      </div>
    </div>
  );
}

function Avisos() {
  return (
    <div className="space-y-3">
      <Alert>
        <AlertTitle>Las ventas están al día</AlertTitle>
        <AlertDescription>Se sincronizaron hace 5 minutos.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>No pudimos guardar el cierre</AlertTitle>
        <AlertDescription>Revisá los montos e intentá de nuevo.</AlertDescription>
      </Alert>
    </div>
  );
}

function TablaDeEjemplo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="text-right">Precio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Medialuna XL</TableCell>
          <TableCell className="text-right">{formatearPesos(123450)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export function SeccionComponentes() {
  return (
    <SeccionGuia titulo="Componentes">
      <div className="space-y-8">
        <Botones />
        <div className="max-w-sm space-y-2">
          <Label htmlFor="guia-nombre">Nombre</Label>
          <Input id="guia-nombre" placeholder="Escribí un nombre" />
        </div>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Tarjeta</CardTitle>
          </CardHeader>
          <CardContent>Así se ve el contenido de una tarjeta.</CardContent>
        </Card>
        <TablaDeEjemplo />
        <Avisos />
        <div className="flex flex-wrap gap-2">
          <Badge>Más vendido</Badge>
          <Badge variant="secondary">Artesanal</Badge>
          <Badge variant="outline">Nuevo</Badge>
        </div>
      </div>
    </SeccionGuia>
  );
}
