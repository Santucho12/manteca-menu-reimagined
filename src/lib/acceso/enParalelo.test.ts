import { describe, expect, it } from 'vitest';
import { accesoYDatos, accesoYLectura } from './enParalelo';

const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, ms));
const ADMIN = { rol: 'admin' };

describe('accesoYDatos', () => {
  it('devuelve el acceso con los datos', async () => {
    const resultado = await accesoYDatos(Promise.resolve(ADMIN), async () => [1, 2]);
    expect(resultado).toEqual({ rol: 'admin', datos: [1, 2] });
  });

  it('pide los datos sin esperar el acceso', async () => {
    let accesoListo = false;
    const acceso = esperar(30).then(() => {
      accesoListo = true;
      return ADMIN;
    });
    let leyoConElAccesoListo: boolean | null = null;
    await accesoYDatos(acceso, async () => {
      leyoConElAccesoListo = accesoListo;
      return [];
    });
    expect(leyoConElAccesoListo).toBe(false);
  });

  it('sin acceso gana el error del acceso aunque la lectura también falle', async () => {
    const acceso = Promise.reject(new Error('redirigir'));
    const leer = () => Promise.reject(new Error('sin permiso'));
    await expect(accesoYDatos(acceso, leer)).rejects.toThrow('redirigir');
  });

  it('si leer lanza sin devolver una promesa, gana el error del acceso', async () => {
    const leer = (): Promise<never> => {
      throw new Error('lanzó');
    };
    await expect(accesoYDatos(Promise.reject(new Error('redirigir')), leer)).rejects.toThrow(
      'redirigir',
    );
  });

  it('con acceso, si la lectura falla, falla con el error de la lectura', async () => {
    const leer = () => Promise.reject(new Error('base caída'));
    await expect(accesoYDatos(Promise.resolve(ADMIN), leer)).rejects.toThrow('base caída');
  });
});

describe('accesoYLectura', () => {
  it('la lectura que nadie espera no deja un rechazo suelto', async () => {
    const sueltos: unknown[] = [];
    const anotar = (motivo: unknown) => sueltos.push(motivo);
    process.on('unhandledRejection', anotar);
    try {
      const leer = () => Promise.reject(new Error('solo admin'));
      const { lectura } = await accesoYLectura(Promise.resolve({ rol: 'caja' }), leer);
      expect(lectura).toBeInstanceOf(Promise);
      await esperar(20);
      expect(sueltos).toEqual([]);
    } finally {
      process.off('unhandledRejection', anotar);
    }
  });
});
