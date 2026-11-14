import { describe, expect, it } from 'vitest';
import { esquemaSinAbrir } from './esquemas';

describe('esquemaSinAbrir', () => {
  it('acepta un dia valido y si se marca o se deshace', () => {
    expect(esquemaSinAbrir.safeParse({ fecha: '2026-10-08', marcar: true }).success).toBe(true);
    expect(esquemaSinAbrir.safeParse({ fecha: '2026-10-08', marcar: false }).success).toBe(true);
  });

  it('rechaza una fecha inventada o un marcar que no es verdadero ni falso', () => {
    expect(esquemaSinAbrir.safeParse({ fecha: '2026-02-30', marcar: true }).success).toBe(false);
    expect(esquemaSinAbrir.safeParse({ fecha: 'ayer', marcar: true }).success).toBe(false);
    expect(esquemaSinAbrir.safeParse({ fecha: '2026-10-08', marcar: 'si' }).success).toBe(false);
  });
});
