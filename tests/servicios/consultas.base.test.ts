import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearClienteSinSesion } from '../../src/lib/supabase/sin-sesion';
import { contarPendientes, listarUsuarios, perfilPropio } from '../../src/lib/usuarios/consultas';
import {
  cantidadDePaginas,
  textoDeBusqueda,
  type FiltrosDeLista,
} from '../../src/lib/usuarios/presentacion';
import { clienteSecretoDePruebas } from '../clientes';
import { emailDePrueba, type RolDePrueba } from '../cuentas';
import {
  borrarCuentaTemporal,
  crearCuentaTemporal,
  type CuentaTemporal,
} from '../cuentas-temporales';
import { clienteComo } from '../sesiones';

const TODOS: FiltrosDeLista = { busqueda: null, estado: 'todos', pagina: 1 };

const email = (rol: RolDePrueba) => emailDePrueba(rol).toLowerCase();

async function emailsQueVe(filtros: Partial<FiltrosDeLista>): Promise<string[]> {
  const { filas } = await listarUsuarios(await clienteComo('admin'), { ...TODOS, ...filtros });
  return filas.map((fila) => fila.email);
}

async function ponerNombre(id: string, nombre: string) {
  const { error } = await clienteSecretoDePruebas().from('perfiles').update({ nombre }).eq('id', id);
  if (error) throw new Error(`No pude poner el nombre: ${error.message}`);
}

describe('perfilPropio', () => {
  it('devuelve el perfil de quien tiene la sesion', async () => {
    expect(await perfilPropio(await clienteComo('caja'))).toMatchObject({
      email: email('caja'),
      rol: 'caja',
      activo: true,
      debe_cambiar_contrasena: false,
    });
  });

  it('un desactivado igual lee su perfil: asi se entera de que esta desactivado', async () => {
    expect(await perfilPropio(await clienteComo('desactivado'))).toMatchObject({ activo: false });
  });

  it('sin sesion no hay perfil', async () => {
    expect(await perfilPropio(crearClienteSinSesion())).toBeNull();
  });
});

describe('listarUsuarios', () => {
  let rechazada: CuentaTemporal;

  beforeAll(async () => {
    rechazada = await crearCuentaTemporal({ rol: 'invitado', activo: false });
  });

  afterAll(async () => {
    await borrarCuentaTemporal(rechazada.id);
  });

  it('el admin ve las cuentas de su local, con el total, y no las de otro', async () => {
    const { filas, total } = await listarUsuarios(await clienteComo('admin'), TODOS);
    const emails = filas.map((fila) => fila.email);
    expect(emails).toContain(email('caja'));
    expect(emails).not.toContain(email('adminOtroLocal'));
    expect(total).toBeGreaterThanOrEqual(filas.length);
  });

  it('los que esperan un rol van primero', async () => {
    const { filas } = await listarUsuarios(await clienteComo('admin'), TODOS);
    const esperan = filas.map((fila) => fila.rol === 'invitado' && fila.activo);
    expect(esperan.lastIndexOf(true)).toBeLessThan(esperan.indexOf(false));
  });

  it.each([
    ['pendientes', 'invitado', true],
    ['pendientes', 'caja', false],
    ['activos', 'caja', true],
    ['activos', 'invitado', false],
    ['desactivados', 'desactivado', true],
    ['desactivados', 'caja', false],
  ] as const)('el filtro %s con la cuenta de %s: %s', async (estado, rol, aparece) => {
    expect((await emailsQueVe({ estado })).includes(email(rol))).toBe(aparece);
  });

  it('desactivados incluye a los invitados rechazados', async () => {
    expect(await emailsQueVe({ estado: 'desactivados' })).toContain(rechazada.email);
  });

  it('busca por nombre y por email, sin importar mayusculas', async () => {
    expect(await emailsQueVe({ busqueda: 'prueba caja' })).toEqual([email('caja')]);
    expect(await emailsQueVe({ busqueda: 'PRUEBA.CAJA@' })).toEqual([email('caja')]);
  });

  it('una busqueda con caracteres de filtro no rompe la consulta', async () => {
    expect(await emailsQueVe({ busqueda: textoDeBusqueda('caja,(%)') })).toEqual([email('caja')]);
  });

  it('el guion bajo se busca tal cual, no como comodin', async () => {
    expect(await emailsQueVe({ busqueda: textoDeBusqueda('prueba_caja') })).toEqual([]);
    await ponerNombre(rechazada.id, 'Cuenta_rechazada');
    const busqueda = textoDeBusqueda('cuenta_rechazada');
    expect(await emailsQueVe({ busqueda, estado: 'desactivados' })).toEqual([rechazada.email]);
  });

  it('una pagina pedida de mas muestra la ultima', async () => {
    const admin = await clienteComo('admin');
    const lejana = await listarUsuarios(admin, { ...TODOS, pagina: 99 });
    const ultima = cantidadDePaginas(lejana.total);
    expect(lejana).toEqual(await listarUsuarios(admin, { ...TODOS, pagina: ultima }));
    expect(lejana.pagina).toBe(ultima);
  });
});

describe('contarPendientes', () => {
  it('el admin cuenta a los que esperan en su local', async () => {
    expect(await contarPendientes(await clienteComo('admin'))).toBeGreaterThanOrEqual(1);
  });

  it('en el local B no espera nadie', async () => {
    expect(await contarPendientes(await clienteComo('adminOtroLocal'))).toBe(0);
  });
});
