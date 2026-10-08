import { Alert, AlertDescription } from '@/components/ui/alert';

/** Confirma que algo salio bien. Es un estado y no una alerta: no interrumpe al lector de pantalla. */
export function AvisoDeExito({ mensaje }: { mensaje: string }) {
  return (
    <Alert role="status">
      <AlertDescription>{mensaje}</AlertDescription>
    </Alert>
  );
}
