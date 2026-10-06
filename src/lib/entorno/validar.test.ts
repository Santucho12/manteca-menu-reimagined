import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validarEntorno } from './validar';

const esquema = z.object({
  UNA_URL: z.url(),
  UNA_CLAVE: z.string().min(1),
});

describe('validarEntorno', () => {
  it('devuelve los valores cuando estan todos', () => {
    const valores = { UNA_URL: 'https://ejemplo.supabase.co', UNA_CLAVE: 'abc' };
    expect(validarEntorno(esquema, valores)).toEqual(valores);
  });

  it('nombra la variable que falta', () => {
    const valores = { UNA_URL: 'https://ejemplo.supabase.co', UNA_CLAVE: undefined };
    expect(() => validarEntorno(esquema, valores)).toThrow('UNA_CLAVE');
  });

  it('nombra la variable vacia', () => {
    const valores = { UNA_URL: 'https://ejemplo.supabase.co', UNA_CLAVE: '' };
    expect(() => validarEntorno(esquema, valores)).toThrow('UNA_CLAVE');
  });

  it('nombra todas las que estan mal, no solo la primera', () => {
    const error = capturar(() => validarEntorno(esquema, { UNA_URL: 'no-es-url' }));
    expect(error).toContain('UNA_URL');
    expect(error).toContain('UNA_CLAVE');
  });

  it('explica en español donde se cargan', () => {
    expect(() => validarEntorno(esquema, {})).toThrow('.env.local');
  });
});

function capturar(accion: () => unknown): string {
  try {
    accion();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return '';
}
