import type { FilaDeUsuario } from '@/lib/usuarios/presentacion';
import { TarjetaDeUsuario } from './TarjetaDeUsuario';

export function ListaDeUsuarios({ filas, yo }: { filas: FilaDeUsuario[]; yo: string }) {
  if (filas.length === 0) {
    return <p className="text-muted-foreground">No hay cuentas con esos filtros.</p>;
  }
  return (
    <ul aria-label="Cuentas" className="space-y-3">
      {filas.map((fila) => (
        <TarjetaDeUsuario key={fila.id} fila={fila} yo={yo} />
      ))}
    </ul>
  );
}
