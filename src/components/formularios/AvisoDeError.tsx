import { Alert, AlertDescription } from '@/components/ui/alert';

/** Por que no se pudo, dicho para una persona. */
export function AvisoDeError({ mensaje }: { mensaje: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{mensaje}</AlertDescription>
    </Alert>
  );
}
