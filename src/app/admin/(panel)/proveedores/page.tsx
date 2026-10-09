import type { Metadata } from 'next';
import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { pagadoPorProveedor } from '@/lib/gastos/proveedores';
import { listarProveedores, type FiltrosDeProveedores } from '@/lib/proveedores/consultas';
import {
  enlaceDeProveedores,
  filtrosDeProveedores,
  type ParametrosDeProveedores,
} from '@/lib/proveedores/pantalla';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeProveedores } from './ListaDeProveedores';

export const metadata: Metadata = { title: 'Proveedores' };

function Buscador({ filtros }: { filtros: FiltrosDeProveedores }) {
  return (
    <form action="/admin/proveedores" className="flex flex-wrap items-end gap-2">
      <div className="min-w-56 flex-1">
        <Campo id="q" name="q" etiqueta="Buscar por nombre" defaultValue={filtros.busqueda ?? ''} />
      </div>
      {filtros.desactivados ? <input type="hidden" name="desactivados" value="1" /> : null}
      <Button type="submit">Buscar</Button>
    </form>
  );
}

function Paginas({ filtros, total }: { filtros: FiltrosDeProveedores; total: number }) {
  const ultima = cantidadDePaginas(total);
  if (ultima === 1) return null;
  const a = (pagina: number) => enlaceDeProveedores({ ...filtros, pagina });
  return (
    <nav aria-label="Páginas" className="flex items-center gap-4 text-sm">
      {filtros.pagina > 1 ? <Link href={a(filtros.pagina - 1)}>Anterior</Link> : null}
      <span>
        Página {filtros.pagina} de {ultima}
      </span>
      {filtros.pagina < ultima ? <Link href={a(filtros.pagina + 1)}>Siguiente</Link> : null}
    </nav>
  );
}

export default async function PaginaDeProveedores({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeProveedores>;
}) {
  const { cliente } = await exigirPagina('admin');
  const filtros = filtrosDeProveedores(await searchParams);
  const [{ filas, total, pagina }, pagado] = await Promise.all([
    listarProveedores(cliente, filtros),
    pagadoPorProveedor(cliente, diaEnArgentina(new Date())),
  ]);
  const otroEstado = enlaceDeProveedores({
    ...filtros,
    desactivados: !filtros.desactivados,
    pagina: 1,
  });
  return (
    <div className="space-y-6">
      <TituloDePagina>
        {filtros.desactivados ? 'Proveedores desactivados' : 'Proveedores'}
      </TituloDePagina>
      <Button asChild>
        <Link href="/admin/proveedores/nuevo">Nuevo proveedor</Link>
      </Button>
      <Buscador filtros={filtros} />
      <ListaDeProveedores filas={filas} pagado={pagado} />
      <Paginas filtros={{ ...filtros, pagina }} total={total} />
      <Link href={otroEstado} className="inline-block py-2 text-sm underline underline-offset-4">
        {filtros.desactivados ? 'Ver activos' : 'Ver desactivados'}
      </Link>
    </div>
  );
}
