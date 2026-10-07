'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { atributosDeError, nombreDelBotonDeContrasena } from '@/lib/formularios/accesibilidad';
import { ErrorDeCampo, type PropsDeCampo } from './Campo';

/** Contraseña con un boton para verla: en vez de pedirla dos veces, se revisa lo escrito. */
export function CampoContrasena({ id, etiqueta, error, ...props }: Omit<PropsDeCampo, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="flex gap-2">
        <Input
          {...props}
          id={id}
          type={visible ? 'text' : 'password'}
          {...atributosDeError(id, error)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={nombreDelBotonDeContrasena(etiqueta, visible)}
          aria-controls={id}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </Button>
      </div>
      <ErrorDeCampo id={id} error={error} />
    </div>
  );
}
