import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Santiago, 2026-11-20: el ingreso, el registro y el cambio de contraseña van con el dorado de
// Manteca; el resto del panel sigue sin dorado.
describe('las pantallas de ingreso', () => {
  it('cargan el dorado de Manteca, con letra oscura', () => {
    const layout = readFileSync('src/app/admin/(acceso)/layout.tsx', 'utf8');
    expect(layout).toContain("import '@/estilos/ingreso-dorado.css';");
    expect(layout).toContain('className="ingreso-dorado"');
    const css = readFileSync('src/estilos/ingreso-dorado.css', 'utf8');
    expect(css).toContain('--color-primary: #bfa042;');
    expect(css).toContain('--color-primary-foreground: #1a1a1a;');
  });
});
