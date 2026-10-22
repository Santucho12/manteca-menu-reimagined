'use client';

import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { atributosDeError, nombreDelBotonDeContrasena } from '@/lib/formularios/accesibilidad';
import { cn } from '@/lib/utils';
import { ErrorDeCampo, clasesDeCampo, clasesDeEtiqueta, type PropsDeCampo } from './Campo';

const OJO =
  'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors';

/**
 * Contraseña con el ojo de Plan Reminder Pro para verla: en vez de pedirla dos veces, se revisa lo
 * escrito. En el ingreso lleva el candado adelante, como los otros campos de la tarjeta.
 */
export function CampoContrasena(props: Omit<PropsDeCampo, 'type' | 'icono'>) {
  const { id, etiqueta, error, variante = 'panel', className, ...resto } = props;
  const [visible, setVisible] = useState(false);
  return (
    <div className={variante === 'panel' ? 'space-y-2' : undefined}>
      <label htmlFor={id} className={clasesDeEtiqueta(variante)}>
        {etiqueta}
      </label>
      <div className="relative">
        {variante === 'ingreso' ? (
          <Lock
            size={16}
            strokeWidth={2}
            aria-hidden
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
          />
        ) : null}
        <input
          {...resto}
          id={id}
          type={visible ? 'text' : 'password'}
          className={cn(clasesDeCampo(variante), 'pr-12 font-mono', className)}
          {...atributosDeError(id, error)}
        />
        <button
          type="button"
          aria-label={nombreDelBotonDeContrasena(etiqueta, visible)}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible(!visible)}
          className={OJO}
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      <ErrorDeCampo id={id} error={error} variante={variante} />
    </div>
  );
}
