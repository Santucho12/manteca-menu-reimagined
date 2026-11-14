import { Ban, ChevronDown } from 'lucide-react';
import { diaDeLaSemana } from '@/lib/caja/diaDeLaSemana';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { BotonDeSinAbrir } from './BotonDeSinAbrir';

function DiaQueNoAbrio({ dia }: { dia: string }) {
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <span className="w-12 rounded-lg bg-slate-100 py-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
        {diaDeLaSemana(dia)}
      </span>
      <span className="font-display text-base font-bold tracking-tight text-foreground">
        {fechaParaMostrar(dia)}
      </span>
      <span className="ml-auto">
        <BotonDeSinAbrir fecha={dia} marcar={false} />
      </span>
    </li>
  );
}

// Los días que el admin marcó: ya no están pendientes, y "Deshacer" los devuelve a pendiente.
export function DiasQueNoAbrio({ dias, abierto = false }: { dias: string[]; abierto?: boolean }) {
  if (dias.length === 0) return null;
  const que = dias.length === 1 ? 'día que el local no abrió' : 'días que el local no abrió';
  return (
    <details open={abierto} className="group rounded-2xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <Ban size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold">{`${dias.length} ${que}`}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="ml-auto shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <ul
        aria-label="Días que no abrió"
        className="mx-4 mb-4 divide-y divide-border overflow-hidden rounded-xl border border-border"
      >
        {dias.map((dia) => (
          <DiaQueNoAbrio key={dia} dia={dia} />
        ))}
      </ul>
    </details>
  );
}
