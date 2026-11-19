'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import {
  anularCompra,
  compraDesdeGasto,
  pedirCompra,
  recibirCompra,
} from '@/lib/compras/escritura';
import {
  esquemaAnularCompra,
  esquemaCompra,
  esquemaDesdeGasto,
  esquemaPedido,
} from '@/lib/compras/esquemas';

const conClave = { clave: z.uuid() };

export async function recibirCompraDesdeElPanel(datos: unknown) {
  const esquema = esquemaCompra.and(z.object(conClave));
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, { clave, ...compra }) =>
    recibirCompra(cliente, compra, clave),
  );
}

export async function pedirCompraDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaPedido.extend(conClave), datos, ({ cliente }, pedido) =>
    pedirCompra(cliente, pedido, pedido.clave),
  );
}

export async function compraDesdeGastoDesdeElPanel(datos: unknown) {
  const esquema = esquemaDesdeGasto.extend(conClave);
  return ejecutarAccion('admin', esquema, datos, ({ cliente }, compra) =>
    compraDesdeGasto(cliente, compra, compra.clave),
  );
}

export async function anularCompraDesdeElPanel(datos: unknown) {
  return ejecutarAccion('admin', esquemaAnularCompra, datos, ({ cliente }, { id, motivo }) =>
    anularCompra(cliente, id, motivo),
  );
}
