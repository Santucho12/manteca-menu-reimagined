import { afterAll, describe, expect, it } from 'vitest';
import { anularGasto } from '../../src/lib/gastos/escritura';
import { porPagarPorProveedor } from '../../src/lib/gastos/proveedores';
import { borrarGastos, pagarComoAdmin, sembrarPorPagar } from '../gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../proveedores-de-prueba';
import { clienteComo } from '../sesiones';

const porPagar: string[] = [];
const gastos: string[] = [];
const proveedores: string[] = [];
afterAll(async () => {
  await borrarGastos({ gastos, porPagar });
  await borrarProveedores(proveedores);
});

async function proveedor() {
  const { id } = await sembrarProveedor();
  proveedores.push(id);
  return id;
}

async function pendiente(proveedorId: string, montoCentavos: number) {
  const { id } = await sembrarPorPagar({ proveedorId, montoCentavos });
  porPagar.push(id);
  return id;
}

describe('porPagarPorProveedor', () => {
  it('suma lo por pagar de cada proveedor, sin lo ya pagado', async () => {
    const id = await proveedor();
    await pendiente(id, 800000);
    await pendiente(id, 500000);
    const pagado = await pagarComoAdmin(await pendiente(id, 300000));
    gastos.push(pagado.data!.id);
    const totales = await porPagarPorProveedor(await clienteComo('admin'));
    expect(totales.get(id)).toBe(1300000);
  });

  it('si el pago se anula, vuelve a deberse', async () => {
    const id = await proveedor();
    const pagado = await pagarComoAdmin(await pendiente(id, 400000));
    gastos.push(pagado.data!.id);
    const admin = await clienteComo('admin');
    expect((await porPagarPorProveedor(admin)).has(id)).toBe(false);
    expect((await anularGasto(admin, pagado.data!.id, 'Pago mal anotado')).ok).toBe(true);
    expect((await porPagarPorProveedor(admin)).get(id)).toBe(400000);
  });

  it('un proveedor sin nada por pagar no figura', async () => {
    const id = await proveedor();
    const totales = await porPagarPorProveedor(await clienteComo('admin'));
    expect(totales.has(id)).toBe(false);
  });

  it('caja no ve lo por pagar de nadie', async () => {
    const id = await proveedor();
    await pendiente(id, 100000);
    const totales = await porPagarPorProveedor(await clienteComo('caja'));
    expect(totales.has(id)).toBe(false);
  });
});
