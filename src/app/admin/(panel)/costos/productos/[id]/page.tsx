import { ChefHat } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { ENLACE_EN_TEXTO } from '@/components/panel/Avisos';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import {
  insumosParaReceta,
  recetaDelProducto,
  type RecetaDelProducto,
} from '@/lib/costos/consultas';
import { datosDeLaReceta } from '@/lib/costos/formulario';
import { Presentaciones } from '../../Presentaciones';
import { BotonDeLaRecetaDelProducto } from './BotonDeLaRecetaDelProducto';
import { FormularioDeReceta } from './FormularioDeReceta';

export const metadata: Metadata = { title: 'Receta' };

type Parametros = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ presentacion?: string }>;
};

function RecetasPropias({ receta, elegida }: { receta: RecetaDelProducto; elegida: string }) {
  const base = `/admin/costos/productos/${receta.producto.productoId}`;
  return (
    <Seccion titulo="Por presentación" forma="lista">
      <ul className="space-y-2 text-sm">
        <li>
          {elegida === '' ? (
            <strong>Receta del producto</strong>
          ) : (
            <Link href={base} className={ENLACE_EN_TEXTO}>
              Receta del producto
            </Link>
          )}
        </li>
        {receta.presentaciones.map((p) => (
          <li key={p.id}>
            {p.nombre}: {p.propia ? 'tiene su propia receta' : 'usa la receta del producto'} ·{' '}
            {elegida === p.id ? (
              <strong>editando</strong>
            ) : (
              <Link href={`${base}?presentacion=${p.id}`} className={ENLACE_EN_TEXTO}>
                {p.propia ? 'Editar la suya' : 'Darle su propia receta'}
              </Link>
            )}
            {p.propia ? (
              <>
                {' · '}
                <BotonDeLaRecetaDelProducto
                  productoId={receta.producto.productoId}
                  presentacionId={p.id}
                />
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

export default async function PaginaDeReceta({ params, searchParams }: Parametros) {
  const { id } = await params;
  const { presentacion = '' } = await searchParams;
  const { datos } = await exigirPaginaYLeer('admin', (c) =>
    Promise.all([recetaDelProducto(c, id), insumosParaReceta(c)]),
  );
  const [receta, insumos] = datos;
  if (!receta) notFound();
  const inicial = datosDeLaReceta(receta, presentacion);
  return (
    <Pantalla
      titulo={receta.producto.producto}
      subtitulo={receta.producto.categoria}
      ayuda="costos"
    >
      <Seccion icono={<ChefHat className="text-primary" size={24} />}>
        <FormularioDeReceta key={presentacion} inicial={inicial} insumos={insumos} />
      </Seccion>
      <RecetasPropias receta={receta} elegida={inicial.presentacionId} />
      <Seccion titulo="Lo que cuesta y deja" forma="lista">
        <Presentaciones filas={receta.producto.presentaciones} />
      </Seccion>
      <EnlaceDeVolver href="/admin/costos">Volver a costos</EnlaceDeVolver>
    </Pantalla>
  );
}
