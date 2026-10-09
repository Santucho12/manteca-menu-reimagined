import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Badge } from '@/components/ui/badge';
import { exigirPagina } from '@/lib/acceso/servidor';
import { listarCategorias } from '@/lib/gastos/consultas';
import { cambiarEstadoDeCategoriaDesdeElPanel } from '../../acciones-de-configuracion';
import { BotonDeEstado } from '../../BotonDeEstado';
import { FormularioDeCategoria } from '../FormularioDeCategoria';

export const metadata: Metadata = { title: 'Categoría de gastos' };

export default async function FichaDeCategoria({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const { id } = await params;
  // Son pocas: se buscan en la lista. Sin clasificar no se edita.
  const categoria = (await listarCategorias(cliente)).find((c) => c.id === id && !c.de_sistema);
  if (!categoria) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <TituloDePagina>{categoria.nombre}</TituloDePagina>
        {categoria.activo ? null : <Badge variant="outline">Desactivada</Badge>}
      </div>
      <FormularioDeCategoria
        id={categoria.id}
        inicial={{ nombre: categoria.nombre, pideProveedor: categoria.pide_proveedor }}
      />
      <p className="text-muted-foreground max-w-xl text-sm">
        Desactivarla no cambia los gastos que ya la usan: solo deja de ofrecerse al cargar.
      </p>
      <BotonDeEstado
        id={categoria.id}
        activo={categoria.activo}
        cambiar={cambiarEstadoDeCategoriaDesdeElPanel}
      />
      <Link
        href="/admin/gastos/categorias"
        className="inline-block py-2 text-sm underline underline-offset-4"
      >
        Volver a categorías
      </Link>
    </div>
  );
}
