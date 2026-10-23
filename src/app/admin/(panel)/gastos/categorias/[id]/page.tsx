import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotonDeEstado } from '@/components/panel/BotonDeEstado';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { listarCategorias } from '@/lib/gastos/consultas';
import { cambiarEstadoDeCategoriaDesdeElPanel } from '../../acciones-de-configuracion';
import { FormularioDeCategoria } from '../FormularioDeCategoria';

export const metadata: Metadata = { title: 'Categoría de gastos' };

export default async function FichaDeCategoria({ params }: { params: Promise<{ id: string }> }) {
  const { cliente } = await exigirPagina('admin');
  const { id } = await params;
  // Son pocas: se buscan en la lista. Sin clasificar no se edita.
  const categoria = (await listarCategorias(cliente)).find((c) => c.id === id && !c.de_sistema);
  if (!categoria) notFound();
  return (
    <Pantalla titulo={categoria.nombre} subtitulo="Renombrala o desactivala." ayuda="categorias">
      {categoria.activo ? null : (
        <div>
          <InsigniaDeEstado tono="pizarra">Desactivada</InsigniaDeEstado>
        </div>
      )}
      <Seccion>
        <FormularioDeCategoria
          id={categoria.id}
          inicial={{ nombre: categoria.nombre, pideProveedor: categoria.pide_proveedor }}
        />
      </Seccion>
      <p className="text-xs text-muted-foreground max-w-xl">
        Desactivarla no cambia los gastos que ya la usan: solo deja de ofrecerse al cargar.
      </p>
      <BotonDeEstado
        id={categoria.id}
        activo={categoria.activo}
        cambiar={cambiarEstadoDeCategoriaDesdeElPanel}
      />
      <Link
        href="/admin/gastos/categorias"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a categorías
      </Link>
    </Pantalla>
  );
}
