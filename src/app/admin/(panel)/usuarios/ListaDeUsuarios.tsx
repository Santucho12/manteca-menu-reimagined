import { SinResultados } from '@/components/panel/SinResultados';
import type { FilaDeUsuario } from '@/lib/usuarios/presentacion';
import { TarjetaDeUsuario } from './TarjetaDeUsuario';

export function ListaDeUsuarios({ filas, yo }: { filas: FilaDeUsuario[]; yo: string }) {
  if (filas.length === 0) {
    return <SinResultados titulo="Sin cuentas" texto="No hay cuentas con esos filtros." />;
  }
  return (
    <ul aria-label="Cuentas" className="grid grid-cols-1 gap-4">
      {filas.map((fila) => (
        <TarjetaDeUsuario key={fila.id} fila={fila} yo={yo} />
      ))}
    </ul>
  );
}
