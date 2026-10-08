'use client';

import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Button } from '@/components/ui/button';
import type { Desactivados } from '@/lib/menu/panel';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import { reactivarEnElMenu } from '../acciones';

type Item = { tipo: 'categoria' | 'producto'; id: string; nombre: string; detalle: string };

function itemsDe({ categorias, productos }: Desactivados): Item[] {
  return [
    ...categorias.map((c) => ({
      tipo: 'categoria' as const,
      id: c.id,
      nombre: c.nombre,
      detalle: 'Categoría',
    })),
    ...productos.map((p) => ({
      tipo: 'producto' as const,
      id: p.id,
      nombre: p.nombre,
      detalle: `Producto de ${p.categoria}`,
    })),
  ];
}

export function ListaDeDesactivados({ desactivados }: { desactivados: Desactivados }) {
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  const items = itemsDe(desactivados);
  if (items.length === 0) return <p className="text-muted-foreground">No hay nada desactivado.</p>;
  return (
    <div className="space-y-3">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <ul className="divide-y rounded-xl border">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span>
              <span className="font-medium">{item.nombre}</span>{' '}
              <span className="text-muted-foreground text-sm">{item.detalle}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={enviando}
              aria-label={`Reactivar ${item.nombre}`}
              onClick={() => hacer(() => reactivarEnElMenu({ tipo: item.tipo, id: item.id }))}
            >
              Reactivar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
