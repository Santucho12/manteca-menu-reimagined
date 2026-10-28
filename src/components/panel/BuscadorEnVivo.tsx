'use client';

import { LoaderCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useBusquedaEnVivo } from '@/lib/panel/useBusquedaEnVivo';

type Props = {
  etiqueta: string;
  ruta: string;
  filtros: Record<string, string>;
  valor?: string | null;
};

/** El buscador de la barra que filtra al escribir, sin botón "Buscar". Enter sigue funcionando. */
export function BuscadorEnVivo({ etiqueta, ruta, filtros, valor }: Props) {
  const { buscar, pendiente } = useBusquedaEnVivo(ruta, filtros);
  const Icono = pendiente ? LoaderCircle : Search;
  return (
    <div className="relative flex-1" aria-busy={pendiente}>
      <Icono
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none ${pendiente ? 'animate-spin' : ''}`}
        size={20}
        aria-hidden="true"
      />
      <Input
        name="q"
        aria-label={etiqueta}
        placeholder={`${etiqueta}...`}
        defaultValue={valor ?? ''}
        onChange={(evento) => buscar(evento.target.value)}
        className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 text-base font-medium focus-visible:ring-primary/20 transition-all"
      />
    </div>
  );
}
