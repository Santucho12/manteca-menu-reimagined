import { TIPOGRAFIAS } from '@/lib/guia/tokens';
import { SeccionGuia } from './SeccionGuia';

const TAMANOS = ['text-sm', 'text-base', 'text-xl', 'text-3xl'] as const;

// Trae acentos y eñe a proposito: asi se ve que letras dibuja cada tipografia.
const MUESTRA = 'Cafetería y medialunas de la mañana';

export function SeccionTipografias() {
  return (
    <SeccionGuia titulo="Tipografías">
      <ul className="space-y-6">
        {TIPOGRAFIAS.map((tipografia) => (
          <li key={tipografia.variable} className="space-y-2">
            <p className="text-muted-foreground text-xs">
              {tipografia.nombre} · {tipografia.variable}
            </p>
            {TAMANOS.map((tamano) => (
              <p
                key={tamano}
                className={tamano}
                style={{ fontFamily: `var(${tipografia.variable})` }}
              >
                {MUESTRA}
              </p>
            ))}
            {tipografia.nota ? <p className="text-sm font-medium">{tipografia.nota}</p> : null}
          </li>
        ))}
      </ul>
    </SeccionGuia>
  );
}
