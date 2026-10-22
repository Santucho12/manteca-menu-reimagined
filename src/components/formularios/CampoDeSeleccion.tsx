import type { ComponentProps } from 'react';
import { CAMPO, ETIQUETA } from '@/components/panel/estilos';
import { atributosDeError } from '@/lib/formularios/accesibilidad';
import { ErrorDeCampo } from './Campo';

type Props = ComponentProps<'select'> & {
  id: string;
  etiqueta: string;
  error?: string;
  opciones: { valor: string; texto: string }[];
};

/** La lista nativa con las clases de los campos de Plan Reminder Pro: la flecha es la del navegador. */
export function CampoDeSeleccion({ id, etiqueta, error, opciones, ...props }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      <select {...props} id={id} {...atributosDeError(id, error)} className={CAMPO}>
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
