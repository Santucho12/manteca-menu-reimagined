import { expect, inject, it } from 'vitest';

// La comprobacion de la preparacion sirve solo si los tests usan la base que ella miro.
// tests/entorno-ajeno.base.test.ts corre este archivo con un archivo de entorno de mas.
it('los tests usan la base que comprobo la preparacion', () => {
  expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(inject('urlDeLaBaseComprobada'));
});
