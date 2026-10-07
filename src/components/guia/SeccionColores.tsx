import { COLORES } from '@/lib/guia/tokens';
import { SeccionGuia } from './SeccionGuia';

export function SeccionColores() {
  return (
    <SeccionGuia titulo="Colores">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {COLORES.map((color) => (
          <li key={color.variable} className="space-y-2">
            <div
              role="img"
              aria-label={`Muestra del color ${color.nombre}`}
              className="h-16 rounded-lg border"
              style={{ backgroundColor: `var(${color.variable})` }}
            />
            <p className="text-sm font-medium">{color.nombre}</p>
            <p className="text-muted-foreground text-xs">{color.variable}</p>
          </li>
        ))}
      </ul>
    </SeccionGuia>
  );
}
