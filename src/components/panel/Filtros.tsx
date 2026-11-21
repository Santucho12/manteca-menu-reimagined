import { Archive, Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BARRA_DE_FILTROS } from './estilos';
import { SelectorDeFiltro } from './SelectorDeFiltro';

type PropsDeLaBarra = { accion: string; ocultos?: Record<string, string>; children: ReactNode };

/**
 * La barra de filtros de Plan Reminder Pro. PRP le pone mb-4 md:mb-8 dentro de un space-y-6: en
 * Tailwind 3 quedaba el mayor (24 y 32 px); en Tailwind 4 gana el del hijo, por eso mb-6 md:mb-8.
 * La lista se lee en el servidor: cada filtro es un campo de un formulario GET.
 */
export function BarraDeFiltros({ accion, ocultos = {}, children }: PropsDeLaBarra) {
  return (
    <form action={accion} role="search" className={BARRA_DE_FILTROS}>
      {Object.entries(ocultos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      {children}
    </form>
  );
}

type PropsDeBusqueda = { etiqueta: string; name?: string; valor?: string | null };

/** El buscador de la barra, con su boton "Buscar" (extension: Plan Reminder Pro filtra al escribir). */
export function Buscador({ etiqueta, name = 'q', valor }: PropsDeBusqueda) {
  return (
    <div className="flex flex-1 gap-2 md:gap-3">
      <div className="relative flex-1">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          size={20}
          aria-hidden="true"
        />
        <Input
          name={name}
          aria-label={etiqueta}
          placeholder={`${etiqueta}...`}
          defaultValue={valor ?? ''}
          className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 text-base font-medium focus-visible:ring-primary/20 transition-all"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 px-4 md:px-6 h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary text-primary-foreground font-bold text-sm md:uppercase md:tracking-widest whitespace-nowrap shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200"
      >
        Buscar
      </button>
    </div>
  );
}

type PropsDeCampo = { id: string; name: string; etiqueta: string };

/** Una lista desplegable de la barra: al elegir, la barra se envía sola. */
export function FiltroDeSeleccion({
  name,
  etiqueta,
  opciones,
  valor,
}: PropsDeCampo & { opciones: { valor: string; texto: string }[]; valor?: string }) {
  return (
    <div className="xl:min-w-[170px] xl:flex-1">
      <SelectorDeFiltro name={name} etiqueta={etiqueta} opciones={opciones} valor={valor ?? ''} />
    </div>
  );
}

// Vive en su archivo: muestra día/mes/año y necesita el navegador.
export { FiltroDeFecha } from './FiltroDeFecha';

/** El boton de una barra que filtra sin buscador. */
export function BotonDeFiltrar({ texto = 'Filtrar' }: { texto?: string }) {
  return (
    <button
      type="submit"
      className="h-11 md:h-14 px-5 rounded-xl md:rounded-2xl bg-primary text-primary-foreground font-bold text-sm md:uppercase md:tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 self-end"
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      {texto}
    </button>
  );
}

/** Un filtro que es un enlace, con la forma de los desplegables (extension). */
export function FiltroEnlace({
  href,
  prendido,
  children,
}: {
  href: string;
  prendido: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={prendido ? 'true' : undefined}
      className={cn(
        'inline-flex items-center gap-2 w-full sm:w-[180px] min-w-0 h-11 md:h-14 px-3 md:px-4 rounded-xl md:rounded-2xl bg-secondary/30 hover:bg-secondary/60 text-xs md:text-sm font-semibold transition-all',
        prendido && 'bg-primary/10 hover:bg-primary/15 text-primary ring-1 ring-primary/20',
      )}
    >
      <Archive
        className={cn(
          'w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0',
          prendido ? 'text-primary' : 'text-muted-foreground/60',
        )}
        aria-hidden="true"
      />
      <span className="truncate">{children}</span>
    </Link>
  );
}
