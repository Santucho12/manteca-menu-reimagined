import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BURBUJA } from './Insignia';

// El contador de la barra como burbuja roja sobre el ícono, como las notificaciones de las apps
// (Santiago, 2026-11-20, pedido 102: el estilo 9).
describe('el contador de pendientes de la barra', () => {
  it('es una burbuja roja con el número en blanco, sobre la esquina del ícono', () => {
    expect(BURBUJA).toContain('absolute -top-1.5 -right-2.5');
    expect(BURBUJA).toContain('rounded-full bg-rose-600 text-white');
    expect(BURBUJA).toContain('ring-2 ring-card');
  });

  it('en la barra lateral va sobre el ícono, no al costado del nombre', () => {
    const enlace = readFileSync('src/components/panel/EnlaceLateral.tsx', 'utf8');
    expect(enlace).toMatch(
      /<span className="relative[^"]*">\s*<Icono[\s\S]*?<Insignia numero=\{enlace\.insignia\} clave=\{enlace\.clave\} \/>\s*<\/span>/,
    );
  });
});
