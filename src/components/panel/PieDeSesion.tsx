import { BotonSalir } from './BotonSalir';

/**
 * Quien tiene la sesion (extension: las pruebas piden ver el nombre), con Salir al lado: en una
 * sola fila, para que la barra entre sin desplazarse (Santiago, 2026-10-26).
 */
export function PieDeSesion({ nombre }: { nombre: string }) {
  return (
    <div className="p-3">
      <div className="group flex items-center gap-2.5 pl-3 pr-1 py-1.5 rounded-2xl bg-secondary/40 border border-transparent transition-all duration-300 hover:bg-white hover:border-border hover:shadow-md hover:shadow-slate-900/5">
        <span
          aria-hidden="true"
          className="w-7 h-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
        >
          {nombre.charAt(0)}
        </span>
        <p className="flex-1 min-w-0 truncate text-[13px] font-semibold">{nombre}</p>
        <BotonSalir variante="barra" />
      </div>
    </div>
  );
}
