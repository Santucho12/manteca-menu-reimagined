import { Badge } from '@/components/ui/badge';
import {
  accionesDisponibles,
  estadoDeCuenta,
  nombreDeRol,
  type FilaDeUsuario,
} from '@/lib/usuarios/presentacion';
import { AccionesDeUsuario } from './AccionesDeUsuario';

export function TarjetaDeUsuario({ fila, yo }: { fila: FilaDeUsuario; yo: string }) {
  const cuenta = { id: fila.id, nombre: fila.nombre, email: fila.email };
  return (
    <li className="bg-card space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{fila.nombre}</span>
          <Badge variant="outline">{nombreDeRol(fila.rol)}</Badge>
          <Badge variant="secondary">{estadoDeCuenta(fila)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm break-all">{fila.email}</p>
      </div>
      <AccionesDeUsuario cuenta={cuenta} acciones={accionesDisponibles(fila, yo)} />
    </li>
  );
}
