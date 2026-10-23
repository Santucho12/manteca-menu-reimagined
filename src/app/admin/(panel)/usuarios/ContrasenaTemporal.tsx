import { KeyRound } from 'lucide-react';
import { textoDeTemporal } from '@/lib/usuarios/pantalla';

/** Se ve una sola vez: no se guarda en ningun lado y al recargar desaparece. */
export function ContrasenaTemporal({ nombre, contrasena }: { nombre: string; contrasena: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
      <div className="flex items-start gap-3 text-emerald-900">
        <KeyRound size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm font-semibold">{textoDeTemporal(nombre)}</p>
      </div>
      <output
        aria-label="Contraseña temporal"
        className="block font-mono text-lg font-bold tracking-wider text-emerald-900 break-all"
      >
        {contrasena}
      </output>
    </div>
  );
}
