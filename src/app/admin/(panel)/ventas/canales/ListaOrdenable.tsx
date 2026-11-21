'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Store } from 'lucide-react';
import Link from 'next/link';
import { useState, type KeyboardEvent } from 'react';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import { cn } from '@/lib/utils';
import { moverEnLista } from '@/lib/ventas/orden';
import { ordenarCanalesDesdeElPanel } from '../acciones';
import { AccionesDeCanal } from './AccionesDeCanal';

type Canal = { id: string; nombre: string; activo: boolean };
type PropsDeFila = { canal: Canal; mover: (paso: -1 | 1) => void; soltar: () => void };

/** Una fila: se arrastra solo desde la manija, así el nombre y los botones siguen andando. */
function Fila({ canal, mover, soltar }: PropsDeFila) {
  const controles = useDragControls();
  const conTeclado = (evento: KeyboardEvent) => {
    if (evento.key === 'ArrowUp') mover(-1);
    else if (evento.key === 'ArrowDown') mover(1);
    else return;
    evento.preventDefault();
  };
  return (
    <Reorder.Item
      value={canal}
      dragListener={false}
      dragControls={controles}
      onDragEnd={soltar}
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-white px-3 py-1.5 transition-colors duration-200 hover:bg-secondary/50',
        !canal.activo && 'opacity-60',
      )}
    >
      <button
        type="button"
        aria-label={`Mover ${canal.nombre}`}
        title="Arrastrá para ordenar, o usá las flechas"
        onPointerDown={(evento) => controles.start(evento)}
        onKeyDown={conTeclado}
        className="flex h-9 w-6 pointer-coarse:w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-300 hover:text-slate-500 active:cursor-grabbing"
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Store size={16} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Link
          href={`/admin/ventas/canales/${canal.id}`}
          className="min-w-0 wrap-break-word text-sm font-bold text-foreground"
        >
          {canal.nombre}
        </Link>
        {canal.activo ? null : <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>}
      </div>
      <AccionesDeCanal id={canal.id} nombre={canal.nombre} activo={canal.activo} />
    </Reorder.Item>
  );
}

/** Los tipos de venta en el orden de Vender: se arrastran desde la manija y el orden se guarda solo. */
export function ListaOrdenable({ canales }: { canales: Canal[] }) {
  const [lista, setLista] = useState(canales);
  // Si la página trae otros tipos (se sumó o se borró uno), la lista se vuelve a armar.
  const [recibidos, setRecibidos] = useState(canales);
  if (recibidos !== canales) {
    setRecibidos(canales);
    setLista(canales);
  }
  const { mensaje, hacer } = useAccionDelMenu();
  const guardar = (orden: Canal[]) =>
    hacer(() => ordenarCanalesDesdeElPanel({ ids: orden.map((c) => c.id) }));
  const mover = (indice: number, paso: -1 | 1) => {
    const nueva = moverEnLista(lista, indice, paso);
    setLista(nueva);
    if (nueva !== lista) void guardar(nueva);
  };
  return (
    <>
      <Reorder.Group
        axis="y"
        values={lista}
        onReorder={setLista}
        aria-label="Tipos de venta"
        className="space-y-0.5"
      >
        {lista.map((canal, indice) => (
          <Fila
            key={canal.id}
            canal={canal}
            mover={(paso) => mover(indice, paso)}
            soltar={() => void guardar(lista)}
          />
        ))}
      </Reorder.Group>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </>
  );
}
