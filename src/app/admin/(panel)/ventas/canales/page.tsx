import { Store } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { canalesDeVenta } from '@/lib/ventas/consultas';
import { FormularioDeCanal } from './FormularioDeCanal';

export const metadata: Metadata = { title: 'Canales de venta' };

type Canal = Awaited<ReturnType<typeof canalesDeVenta>>[number];

const ENLACE =
  'text-xs font-semibold text-foreground hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

const Nombre = ({ canal }: { canal: Canal }) => (
  <Link href={`/admin/ventas/canales/${canal.id}`} className={ENLACE}>
    {canal.nombre}
  </Link>
);

const Estado = ({ canal }: { canal: Canal }) =>
  canal.activo ? null : <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>;

const COLUMNAS: Columna<Canal>[] = [
  { titulo: 'Canal', celda: (c) => <Nombre canal={c} /> },
  { titulo: 'Estado', celda: (c) => <Estado canal={c} /> },
];

export default async function PaginaDeCanales() {
  const { cliente } = await exigirPagina('admin');
  const canales = await canalesDeVenta(cliente);
  return (
    <Pantalla
      titulo="Canales de venta"
      subtitulo="Por dónde entran las ventas que no pasan por Fudo."
      ayuda="canales"
    >
      <Seccion titulo="Sumar un canal">
        <FormularioDeCanal />
      </Seccion>
      <ListaDelPanel
        etiqueta="Canales"
        icono={Store}
        total={canales.length}
        filas={canales}
        clave={(c) => c.id}
        columnas={COLUMNAS}
        tarjeta={(c) => (
          <>
            <Nombre canal={c} />
            <Estado canal={c} />
          </>
        )}
      />
      <Link
        href="/admin/ventas"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a ventas
      </Link>
    </Pantalla>
  );
}
