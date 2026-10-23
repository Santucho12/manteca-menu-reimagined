import { BotonSalir } from './BotonSalir';

/** Quien tiene la sesion (extension: las pruebas piden ver el nombre), arriba de Salir. */
export function PieDeSesion({ nombre }: { nombre: string }) {
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-secondary/40">
        <span
          aria-hidden="true"
          className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase"
        >
          {nombre.charAt(0)}
        </span>
        <p className="min-w-0 truncate text-[13px] font-semibold">{nombre}</p>
      </div>
      <BotonSalir variante="lateral" />
    </div>
  );
}
