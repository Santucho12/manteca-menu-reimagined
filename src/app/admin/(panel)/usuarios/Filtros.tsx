import { BuscadorEnVivo } from '@/components/panel/BuscadorEnVivo';
import { BarraDeFiltros } from '@/components/panel/Filtros';
import type { FiltrosDeLista } from '@/lib/usuarios/presentacion';
import { FiltroDeEstado } from './FiltroDeEstado';

const RUTA = '/admin/usuarios';

export function Filtros({ filtros }: { filtros: FiltrosDeLista }) {
  const conservados: Record<string, string> =
    filtros.estado === 'todos' ? {} : { estado: filtros.estado };
  return (
    <BarraDeFiltros accion={RUTA} ocultos={conservados}>
      <BuscadorEnVivo
        etiqueta="Buscar por nombre o email"
        ruta={RUTA}
        filtros={conservados}
        valor={filtros.busqueda}
      />
      <FiltroDeEstado estado={filtros.estado} busqueda={filtros.busqueda} />
    </BarraDeFiltros>
  );
}
