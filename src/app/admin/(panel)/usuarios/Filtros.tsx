import Link from 'next/link';
import { BarraDeFiltros, Buscador } from '@/components/panel/Filtros';
import { ATAJO } from '@/components/panel/estilos';
import { cn } from '@/lib/utils';
import {
  OPCIONES_DE_ESTADO,
  enlaceDeUsuarios,
  type FiltrosDeLista,
} from '@/lib/usuarios/presentacion';

export function Filtros({ filtros }: { filtros: FiltrosDeLista }) {
  return (
    <div className="space-y-4">
      <BarraDeFiltros accion="/admin/usuarios" ocultos={{ estado: filtros.estado }}>
        <Buscador etiqueta="Buscar por nombre o email" valor={filtros.busqueda} />
      </BarraDeFiltros>
      <nav aria-label="Estado" className="flex flex-wrap gap-2">
        {OPCIONES_DE_ESTADO.map((opcion) => {
          const activo = opcion.valor === filtros.estado;
          return (
            <Link
              key={opcion.valor}
              href={enlaceDeUsuarios({
                busqueda: filtros.busqueda,
                estado: opcion.valor,
                pagina: 1,
              })}
              aria-current={activo ? 'page' : undefined}
              className={cn(
                ATAJO,
                activo && 'bg-primary text-white hover:bg-primary hover:text-white',
              )}
            >
              {opcion.texto}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
