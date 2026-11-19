import { describe, expect, it } from 'vitest';
import {
  esquemaMargenes,
  esquemaReceta,
  esquemaUnidades,
  recetaParaLaBase,
  unidadesParaLaBase,
} from './esquemas';

const INSUMO = '0b8f3c2e-5d1a-4c7e-9f2b-1a2b3c4d5e6f';
const PRODUCTO = '1c9a4d3f-6e2b-4d8f-8a3c-2b3c4d5e6f70';

describe('esquemaReceta', () => {
  it('pasa a la base con numeros y la presentacion vacia como nula', () => {
    const datos = esquemaReceta.parse({
      productoId: PRODUCTO,
      presentacionId: '',
      rinde: '40',
      desperdicio: '5,5',
      renglones: [{ insumoId: INSUMO, cantidad: '1.000' }],
    });
    expect(recetaParaLaBase(datos)).toEqual({
      producto_id: PRODUCTO,
      presentacion_id: null,
      rinde: 40,
      desperdicio_porcentaje: 5.5,
      renglones: [{ insumo_id: INSUMO, cantidad: 1000 }],
    });
  });

  it('rechaza un desperdicio de mas del 50 %, un rinde en cero y una cantidad mal escrita', () => {
    const resultado = esquemaReceta.safeParse({
      productoId: PRODUCTO,
      presentacionId: '',
      rinde: '0',
      desperdicio: '60',
      renglones: [{ insumoId: INSUMO, cantidad: 'mucho' }],
    });
    const campos = resultado.error!.issues.map((error) => error.path.join('.'));
    expect(campos).toEqual(
      expect.arrayContaining(['rinde', 'desperdicio', 'renglones.0.cantidad']),
    );
  });

  it('pide al menos un insumo', () => {
    const vacia = { productoId: PRODUCTO, presentacionId: '', rinde: '1', desperdicio: '0' };
    expect(esquemaReceta.safeParse({ ...vacia, renglones: [] }).success).toBe(false);
  });
});

describe('esquemaMargenes', () => {
  it('el minimo no puede pasar al objetivo', () => {
    expect(esquemaMargenes.safeParse({ objetivo: 65, minimo: 50 }).success).toBe(true);
    expect(esquemaMargenes.safeParse({ objetivo: 40, minimo: 50 }).success).toBe(false);
    expect(esquemaMargenes.safeParse({ objetivo: 99, minimo: 50 }).success).toBe(false);
  });
});

describe('esquemaUnidades', () => {
  it('el agregado vacio es cero', () => {
    const datos = esquemaUnidades.parse({ unidades: '12', agregado: '' });
    expect(unidadesParaLaBase(datos)).toEqual({ unidades: 12, agregado_centavos: 0 });
    const conCaja = esquemaUnidades.parse({ unidades: '6', agregado: '500' });
    expect(unidadesParaLaBase(conCaja)).toEqual({ unidades: 6, agregado_centavos: 50_000 });
  });

  it('rechaza unidades en cero', () => {
    expect(esquemaUnidades.safeParse({ unidades: '0', agregado: '' }).success).toBe(false);
  });
});
