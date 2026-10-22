import { Tags } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Chip, InsigniaDeEstado } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { listarCategorias, type FilaDeCategoria } from '@/lib/gastos/consultas';
import { FormularioDeCategoria } from './FormularioDeCategoria';

export const metadata: Metadata = { title: 'Categorías de gastos' };

const ENLACE =
  'text-xs font-semibold text-foreground hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

function Nombre({ categoria }: { categoria: FilaDeCategoria }) {
  if (categoria.de_sistema)
    return <span className="text-xs font-semibold">{categoria.nombre}</span>;
  return (
    <Link href={`/admin/gastos/categorias/${categoria.id}`} className={ENLACE}>
      {categoria.nombre}
    </Link>
  );
}

function Estado({ categoria }: { categoria: FilaDeCategoria }) {
  return (
    <span className="flex flex-wrap gap-1">
      {categoria.pide_proveedor ? <Chip>Pide proveedor</Chip> : null}
      {categoria.activo ? null : <InsigniaDeEstado tono="pizarra">Desactivada</InsigniaDeEstado>}
      {categoria.de_sistema ? <Chip>Para los gastos de la caja</Chip> : null}
    </span>
  );
}

const COLUMNAS: Columna<FilaDeCategoria>[] = [
  { titulo: 'Categoría', celda: (c) => <Nombre categoria={c} /> },
  { titulo: 'Estado', celda: (c) => <Estado categoria={c} /> },
];

export default async function PaginaDeCategorias() {
  const { cliente } = await exigirPagina('admin');
  const categorias = await listarCategorias(cliente);
  return (
    <Pantalla
      titulo="Categorías de gastos"
      subtitulo="Cómo se ordenan los gastos."
      ayuda="categorias"
    >
      <Seccion titulo="Sumar una categoría">
        <FormularioDeCategoria />
      </Seccion>
      <ListaDelPanel
        etiqueta="Categorías"
        icono={Tags}
        total={categorias.length}
        filas={categorias}
        clave={(c) => c.id}
        columnas={COLUMNAS}
        tarjeta={(c) => (
          <>
            <Nombre categoria={c} />
            <Estado categoria={c} />
          </>
        )}
      />
      <Link
        href="/admin/gastos"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a gastos
      </Link>
    </Pantalla>
  );
}
