'use client';

import { FileSpreadsheet, Upload, X } from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { tamanoLegible } from '@/lib/ventas/tamanoLegible';
import { cn } from '@/lib/utils';

type Props = { archivo: File | null; elegir: (archivo: File | null) => void };

const ZONA =
  'group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200';

function ArchivoElegido({ archivo, elegir }: Props & { archivo: File }) {
  return (
    <section
      aria-label="Archivo elegido"
      className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
        <FileSpreadsheet size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{archivo.name}</p>
        <p className="text-xs text-muted-foreground">{tamanoLegible(archivo.size)} · Excel</p>
      </div>
      <button
        type="button"
        aria-label="Quitar archivo"
        onClick={() => elegir(null)}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-white hover:text-rose-600"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </section>
  );
}

/** Zona para arrastrar el reporte o elegirlo; el input sigue siendo el de siempre, con su etiqueta. */
export function ZonaDeArchivo({ archivo, elegir }: Props) {
  const [encima, setEncima] = useState(false);
  const soltar = (evento: DragEvent) => {
    evento.preventDefault();
    setEncima(false);
    elegir(evento.dataTransfer.files[0] ?? null);
  };
  return (
    <div className="space-y-3">
      <label
        htmlFor="archivo"
        onDragOver={(evento) => {
          evento.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltar}
        className={cn(
          ZONA,
          encima
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-border bg-secondary/20 hover:border-emerald-400',
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-card text-emerald-600 shadow-xs transition-transform group-hover:scale-105">
          <Upload size={24} aria-hidden="true" />
        </span>
        <span className="text-sm font-bold">Arrastrá el reporte de Fudo acá</span>
        <span className="text-xs text-muted-foreground">
          o elegilo de tu computadora · solo Excel (.xlsx)
        </span>
        <span className="sr-only">Reporte de ventas de Fudo</span>
        <input
          key={archivo ? 'con' : 'sin'}
          id="archivo"
          name="archivo"
          type="file"
          accept=".xlsx"
          className="sr-only"
          onChange={(evento) => elegir(evento.target.files?.[0] ?? null)}
        />
      </label>
      {archivo ? <ArchivoElegido archivo={archivo} elegir={elegir} /> : null}
    </div>
  );
}
