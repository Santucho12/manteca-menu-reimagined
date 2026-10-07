import { Alert, AlertDescription } from '@/components/ui/alert';
import { textoDeTemporal } from '@/lib/usuarios/pantalla';

/** Se ve una sola vez: no se guarda en ningun lado y al recargar desaparece. */
export function ContrasenaTemporal({ nombre, contrasena }: { nombre: string; contrasena: string }) {
  return (
    <Alert>
      <AlertDescription className="space-y-2">
        <p>{textoDeTemporal(nombre)}</p>
        <output
          aria-label="Contraseña temporal"
          className="text-foreground block text-lg font-semibold tracking-wider"
        >
          {contrasena}
        </output>
      </AlertDescription>
    </Alert>
  );
}
