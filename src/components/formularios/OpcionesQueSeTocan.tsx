import { Check } from 'lucide-react';
import { ETIQUETA } from '@/components/panel/estilos';
import { cn } from '@/lib/utils';

type Props = {
  nombre: string;
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  valor: string;
  alCambiar: (valor: string) => void;
};

const OPCION =
  'relative px-3 h-9 text-xs font-bold border transition-colors flex items-center gap-1.5 rounded-xl cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30';

/** Opciones que se eligen tocando (Plan Reminder Pro): por dentro, un grupo de radios. */
export function OpcionesQueSeTocan({ nombre, etiqueta, opciones, valor, alCambiar }: Props) {
  return (
    <fieldset className="space-y-2">
      <legend className={ETIQUETA}>{etiqueta}</legend>
      <div className="flex flex-wrap gap-2">
        {opciones.map((opcion) => {
          const elegida = opcion.valor === valor;
          return (
            <label
              key={opcion.valor}
              className={cn(
                OPCION,
                elegida
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-foreground border-border hover:border-violet-300',
              )}
            >
              <input
                type="radio"
                name={nombre}
                value={opcion.valor}
                checked={elegida}
                onChange={() => alCambiar(opcion.valor)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {elegida ? <Check size={12} aria-hidden="true" /> : null}
              {opcion.texto}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
