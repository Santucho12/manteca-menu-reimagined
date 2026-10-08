import Image from 'next/image';
import { urlDeFoto } from '@/lib/menu/fotos';
import type { CategoriaPublica } from '@/lib/menu/publico';
import { Aparecer } from './Aparecer';
import { TarjetaDeProducto } from './TarjetaDeProducto';

type Props = { categoria: CategoriaPublica; urlDeSupabase: string; alternada: boolean };

export function SeccionDelMenu({ categoria, urlDeSupabase, alternada }: Props) {
  const foto = urlDeFoto(categoria.foto, urlDeSupabase);
  const titulo = `titulo-${categoria.ancla}`;
  return (
    <section
      id={categoria.ancla}
      aria-labelledby={titulo}
      className={`scroll-mt-20 px-4 py-12 md:py-16 ${alternada ? 'bg-secondary/50' : ''}`}
    >
      <div className="mx-auto max-w-xl">
        <Aparecer className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span aria-hidden="true" className="text-2xl md:text-3xl">
              {categoria.icono}
            </span>
            <h2 id={titulo} className="font-title text-2xl tracking-tight md:text-3xl">
              {categoria.nombre}
            </h2>
          </div>
          {categoria.subtitulo ? (
            <p className="text-muted-foreground mt-3 text-[10px] tracking-widest uppercase">
              {categoria.subtitulo}
            </p>
          ) : null}
          <div className="divisor-de-seccion mt-4" />
        </Aparecer>
        {foto ? (
          <Aparecer className="relative mb-8 aspect-square overflow-hidden rounded-2xl">
            <Image
              src={foto}
              alt={categoria.nombre}
              fill
              sizes="(max-width: 640px) 100vw, 576px"
              className="object-cover"
            />
          </Aparecer>
        ) : null}
        <ul
          className={`grid gap-3 ${categoria.columnas === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
        >
          {categoria.productos.map((producto) => (
            <TarjetaDeProducto key={producto.id} producto={producto} />
          ))}
        </ul>
      </div>
    </section>
  );
}
