'use server';

import { z } from 'zod';
import { ejecutarAccion } from '@/lib/acceso/servidor';
import { exito, fallo } from '@/lib/resultado';
import { guardarVentaDelMostrador } from '@/lib/vender/escritura';
import { esquemaVentaDelMostrador } from '@/lib/vender/esquemas';

/** Caja o el admin cobran en el mostrador: la venta queda a nombre de la sesión. */
export async function venderDesdeElMostrador(datos: unknown) {
  return ejecutarAccion('caja', esquemaVentaDelMostrador, datos, ({ cliente }, venta) =>
    guardarVentaDelMostrador(cliente, venta),
  );
}

const esquemaArmado = z.object({
  renglonId: z.uuid(),
  detalle: z
    .array(z.object({ producto_id: z.uuid(), unidades: z.number().int().positive() }))
    .min(1),
});

/** Arma unas facturas surtidas ya cobradas: cuáles se llevó (pedido 102). La base controla la suma. */
export async function armarDesdeElMostrador(datos: unknown) {
  return ejecutarAccion('caja', esquemaArmado, datos, async ({ cliente }, armado) => {
    const { error } = await cliente.rpc('ventas_armar', {
      el_renglon: armado.renglonId,
      detalle: armado.detalle,
    });
    if (!error) return exito(undefined);
    return fallo(
      error.code === 'PV321'
        ? 'Las facturas no suman lo cobrado: revisá las cantidades.'
        : 'No pudimos guardar el armado. Probá de nuevo.',
    );
  });
}
