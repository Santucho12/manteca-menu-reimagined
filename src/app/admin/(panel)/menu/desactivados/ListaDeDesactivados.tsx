'use client';

import { RotateCcw } from 'lucide-react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { BOTON_REACTIVAR } from '@/components/panel/estilos';
import { SinResultados } from '@/components/panel/SinResultados';
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
  if (items.length === 0) {
    return <SinResultados titulo="Todo en uso" texto="No hay nada desactivado." />;
  }
  return (
    <div className="space-y-3">
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <ul className="bg-card rounded-2xl border border-border shadow-card divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <span>
              <span className="text-sm font-bold">{item.nombre}</span>{' '}
              <span className="text-xs text-muted-foreground">{item.detalle}</span>
            </span>
            <button
              type="button"
              disabled={enviando}
              aria-label={`Reactivar ${item.nombre}`}
              onClick={() => hacer(() => reactivarEnElMenu({ tipo: item.tipo, id: item.id }))}
              className={BOTON_REACTIVAR}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reactivar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
