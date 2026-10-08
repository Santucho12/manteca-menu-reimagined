import type { ComponentProps } from 'react';
import { Label } from '@/components/ui/label';
import { atributosDeError } from '@/lib/formularios/accesibilidad';
import { ErrorDeCampo } from './Campo';

type Props = ComponentProps<'textarea'> & { id: string; etiqueta: string; error?: string };

export function CampoDeTextoLargo({ id, etiqueta, error, ...props }: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <textarea
        {...props}
        id={id}
        rows={3}
        {...atributosDeError(id, error)}
        className="border-input bg-background w-full rounded-lg border px-2.5 py-2 text-sm"
      />
      <ErrorDeCampo id={id} error={error} />
    </div>
  );
}
