import { BotonSalir } from './BotonSalir';

/** Quien tiene la sesion (extension: las pruebas piden ver el nombre), arriba de Salir. */
export function PieDeSesion({ nombre }: { nombre: string }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/40">
        <span
          aria-hidden="true"
          className="w-9 h-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase"
        >
          {nombre.charAt(0)}
        </span>
        <p className="min-w-0 truncate text-sm font-semibold">{nombre}</p>
      </div>
      <BotonSalir variante="lateral" />
    </div>
  );
}
