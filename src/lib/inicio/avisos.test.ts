import { describe, expect, it } from 'vitest';
import { avisosDeInicio, type DatosDeAvisos } from './avisos';

const NADA: DatosDeAvisos = {
  conDiferencia: { cantidad: 0, desde: null },
  ayerSinCierre: null,
  pendientes: 0,
  sinClasificar: { cantidad: 0, desde: null, categoriaId: 'sc' },
};

const pagos = (vencidos: number, estaSemana: number, unico: string | null = null) => ({
  vencidos,
  estaSemana,
  unico,
});
const textosDe = (datos: Partial<DatosDeAvisos>) =>
  avisosDeInicio({ ...NADA, ...datos }).map((aviso) => aviso.texto);

describe('avisosDeInicio', () => {
  it('avisa los productos debajo del margen minimo y lleva a Costos con ese filtro', () => {
    expect(avisosDeInicio({ ...NADA, debajoDelMinimo: 3 })).toEqual([
      {
        texto: '3 productos están debajo del margen mínimo.',
        enlace: '/admin/costos?filtro=debajo',
      },
    ]);
    expect(textosDe({ debajoDelMinimo: 1 })).toEqual(['1 producto está debajo del margen mínimo.']);
    expect(textosDe({ debajoDelMinimo: 0 })).toEqual([]);
  });

  it('sin nada pendiente no hay avisos', () => {
    expect(avisosDeInicio(NADA)).toEqual([]);
  });

  it('arma cada aviso con su enlace, en orden', () => {
    expect(
      avisosDeInicio({
        conDiferencia: { cantidad: 2, desde: '2026-09-20' },
        ayerSinCierre: { fecha: '2026-10-11', turnos: [2] },
        pendientes: 1,
        sinClasificar: { cantidad: 3, desde: '2026-08-02', categoriaId: 'sc' },
      }),
    ).toMatchObject([
      {
        texto: 'Hay 2 cierres con diferencia sin revisar.',
        enlace: '/admin/caja/control?estado=con_diferencia&desde=2026-09-20',
      },
      {
        texto: 'Ayer quedó sin cargar el cierre de la noche.',
        enlace: '/admin/caja/control?desde=2026-10-11&hasta=2026-10-11',
      },
      { texto: 'Hay 1 persona esperando un rol.', enlace: '/admin/usuarios?estado=pendientes' },
      // Gastos muestra arriba de todo los que esperan categoría, de cualquier mes.
      { texto: 'Hay 3 gastos sin clasificar.', enlace: '/admin/gastos' },
    ]);
  });

  it('avisa los pagos que vencen esta semana, al final', () => {
    expect(avisosDeInicio({ ...NADA, pagos: pagos(0, 2) })).toEqual([
      { texto: 'Esta semana vencen 2 pagos.', enlace: '/admin/gastos' },
    ]);
    expect(textosDe({ pagos: pagos(0, 1, 'x') })).toEqual(['Esta semana vence 1 pago.']);
  });

  it('avisa lo vencido, solo o junto con lo de la semana, en un solo aviso', () => {
    expect(textosDe({ pagos: pagos(1, 0, 'x') })).toEqual(['Tenés 1 pago vencido.']);
    expect(textosDe({ pagos: pagos(2, 0) })).toEqual(['Tenés 2 pagos vencidos.']);
    expect(textosDe({ pagos: pagos(2, 1) })).toEqual([
      'Tenés 2 pagos vencidos y 1 que vence esta semana.',
    ]);
    expect(textosDe({ pagos: pagos(1, 3) })).toEqual([
      'Tenés 1 pago vencido y 3 que vencen esta semana.',
    ]);
  });

  it('si es uno solo, el aviso lleva a Gastos con ese pago para pagarlo', () => {
    const [aviso] = avisosDeInicio({ ...NADA, pagos: pagos(0, 1, 'fijo-1|2026-10-30') });
    expect(aviso!.enlace).toBe('/admin/gastos?pagar=fijo-1%7C2026-10-30');
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
