import { describe, expect, it } from 'vitest';
import { avisosDeInicio, type DatosDeAvisos } from './avisos';

const NADA: DatosDeAvisos = {
  conDiferencia: { cantidad: 0, desde: null },
  ayerSinCierre: null,
  pendientes: 0,
  sinClasificar: { cantidad: 0, desde: null, categoriaId: 'sc' },
};

describe('avisosDeInicio', () => {
  it('sin nada pendiente no hay avisos', () => {
    expect(avisosDeInicio(NADA)).toEqual([]);
  });

  it('arma cada aviso con su enlace, en orden', () => {
    expect(
      avisosDeInicio({
        conDiferencia: { cantidad: 2, desde: '2026-09-20' },
        ayerSinCierre: '2026-10-11',
        pendientes: 1,
        sinClasificar: { cantidad: 3, desde: '2026-08-02', categoriaId: 'sc' },
      }),
    ).toEqual([
      {
        texto: 'Hay 2 cierres con diferencia sin revisar.',
        enlace: '/admin/caja/control?estado=con_diferencia&desde=2026-09-20',
      },
      {
        texto: 'Ayer no se cargó el cierre de caja.',
        enlace: '/admin/caja/control?desde=2026-10-11&hasta=2026-10-11',
      },
      { texto: 'Hay 1 persona esperando un rol.', enlace: '/admin/usuarios?estado=pendientes' },
      {
        texto: 'Hay 3 gastos sin clasificar.',
        enlace: '/admin/gastos?categoria=sc&desde=2026-08-02',
      },
    ]);
  });

  it('en singular cuando es uno', () => {
    const avisos = avisosDeInicio({
      ...NADA,
      conDiferencia: { cantidad: 1, desde: '2026-10-01' },
      sinClasificar: { cantidad: 1, desde: '2026-10-01', categoriaId: 'sc' },
    });
    expect(avisos.map((a) => a.texto)).toEqual([
      'Hay 1 cierre con diferencia sin revisar.',
      'Hay 1 gasto sin clasificar.',
    ]);
  });
});
