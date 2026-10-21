import { Croissant } from 'lucide-react';

/** La marca del panel: el cuadrado con el croissant, el nombre y, en la sidebar, que es. */
export function MarcaDelPanel({ chica = false }: { chica?: boolean }) {
  if (chica) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
          <Croissant className="text-white" size={18} aria-hidden />
        </div>
        <span className="font-title text-lg leading-none">Manteca</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/40">
        <Croissant className="text-white" size={24} aria-hidden />
      </div>
      <div>
        <span className="font-title block text-2xl leading-none text-white">Manteca</span>
        <p className="mt-1 text-[9px] font-bold tracking-[0.2em] whitespace-nowrap text-white/50 uppercase">
          Sistema de gestión
        </p>
      </div>
    </div>
  );
}
