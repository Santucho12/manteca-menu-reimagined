import type { Metadata } from 'next';
import Link from 'next/link';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { exigirPagina } from '@/lib/acceso/servidor';
import { listarCategorias, type FilaDeCategoria } from '@/lib/gastos/consultas';
import { FormularioDeCategoria } from './FormularioDeCategoria';

export const metadata: Metadata = { title: 'Categorías de gastos' };

function Fila({ categoria }: { categoria: FilaDeCategoria }) {
  return (
    <li className="flex flex-wrap items-center gap-2 p-4">
      {categoria.de_sistema ? (
        <span className="font-medium">{categoria.nombre}</span>
      ) : (
        <Link
          href={`/admin/gastos/categorias/${categoria.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {categoria.nombre}
        </Link>
      )}
      {categoria.pide_proveedor ? <Badge variant="secondary">Pide proveedor</Badge> : null}
      {categoria.activo ? null : <Badge variant="outline">Desactivada</Badge>}
      {categoria.de_sistema ? (
        <span className="text-muted-foreground text-sm">Para los gastos que llegan de la caja</span>
      ) : null}
    </li>
  );
}

export default async function PaginaDeCategorias() {
  const { cliente } = await exigirPagina('admin');
  const categorias = await listarCategorias(cliente);
  return (
    <div className="space-y-6">
      <TituloDePagina>Categorías de gastos</TituloDePagina>
      <FormularioDeCategoria />
      <ul aria-label="Categorías" className="bg-card divide-y rounded-xl border">
        {categorias.map((categoria) => (
          <Fila key={categoria.id} categoria={categoria} />
        ))}
      </ul>
      <Link href="/admin/gastos" className="inline-block py-2 text-sm underline underline-offset-4">
        Volver a gastos
      </Link>
    </div>
  );
}
