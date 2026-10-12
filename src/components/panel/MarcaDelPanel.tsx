import { Croissant } from 'lucide-react';

/** La marca del panel: el cuadrado con el croissant, el nombre y, en la sidebar, que es. */
export function MarcaDelPanel({ chica = false }: { chica?: boolean }) {
  if (chica) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
          <Croissant className="text-primary-foreground" size={18} aria-hidden />
        </div>
        <span className="font-title text-lg leading-none">Manteca</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className="bg-primary shadow-primary/30 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
        <Croissant className="text-primary-foreground" size={24} aria-hidden />
      </div>
      <div>
        <span className="font-title block text-2xl leading-none">Manteca</span>
        <p className="text-muted-foreground mt-1 text-[8px] font-bold tracking-wider whitespace-nowrap uppercase">
          Sistema de gestión
        </p>
      </div>
    </div>
  );
}
