import type { ComponentProps } from 'react';
import { Label } from '@/components/ui/label';
import { atributosDeError } from '@/lib/formularios/accesibilidad';
import { ErrorDeCampo } from './Campo';

type Props = ComponentProps<'select'> & {
  id: string;
  etiqueta: string;
  error?: string;
  opciones: { valor: string; texto: string }[];
};

export function CampoDeSeleccion({ id, etiqueta, error, opciones, ...props }: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <select
        {...props}
        id={id}
        {...atributosDeError(id, error)}
        className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm pointer-coarse:h-11"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      <ErrorDeCampo id={id} error={error} />
    </div>
  );
}
