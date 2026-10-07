import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  OPCIONES_DE_ESTADO,
  enlaceDeUsuarios,
  type FiltrosDeLista,
} from '@/lib/usuarios/presentacion';

export function Filtros({ filtros }: { filtros: FiltrosDeLista }) {
  return (
    <div className="space-y-4">
      <form action="/admin/usuarios" role="search" className="flex max-w-md items-end gap-2">
        <input type="hidden" name="estado" value={filtros.estado} />
        <div className="flex-1">
          <Campo
            id="busqueda"
            name="q"
            etiqueta="Buscar por nombre o email"
            defaultValue={filtros.busqueda ?? ''}
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>
      <nav aria-label="Estado" className="flex flex-wrap gap-2">
        {OPCIONES_DE_ESTADO.map((opcion) => (
          <Link
            key={opcion.valor}
            href={enlaceDeUsuarios({ busqueda: filtros.busqueda, estado: opcion.valor, pagina: 1 })}
            aria-current={opcion.valor === filtros.estado ? 'page' : undefined}
            className={buttonVariants({
              variant: opcion.valor === filtros.estado ? 'default' : 'outline',
              size: 'sm',
            })}
          >
            {opcion.texto}
          </Link>
        ))}
      </nav>
    </div>
  );
}
