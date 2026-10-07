import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { atributosDeError, idDelError } from '@/lib/formularios/accesibilidad';

export type PropsDeCampo = ComponentProps<'input'> & {
  id: string;
  etiqueta: string;
  error?: string;
};

/** El mensaje de error debajo de un campo. */
export function ErrorDeCampo({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={idDelError(id)} className="text-destructive text-sm">
      {error}
    </p>
  );
}

/** Un campo con su etiqueta y, si hace falta, su error, que el lector de pantalla anuncia. */
export function Campo({ id, etiqueta, error, ...props }: PropsDeCampo) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input {...props} id={id} {...atributosDeError(id, error)} />
      <ErrorDeCampo id={id} error={error} />
    </div>
  );
}
