import { clienteSecretoDePruebas } from './clientes';
import { idDelLocalPrincipal } from './locales';
import type { ParaVender } from './ventas-de-prueba';

type RenglonSembrado = {
  producto: ParaVender | null;
  cantidad: number;
  precioCentavos: number;
  /** El nombre de un producto de Fudo sin vincular. */
  descripcion?: string;
};
export type SemillaConRenglones = {
  fecha: string;
  estado?: 'cerrada' | 'cancelada';
  anulado?: boolean;
  renglones: RenglonSembrado[];
};

const subtotalDe = (r: RenglonSembrado) => Math.round(r.cantidad * r.precioCentavos);

async function insertarVenta(semilla: SemillaConRenglones, local: string): Promise<string> {
  const { data, error } = await clienteSecretoDePruebas()
    .from('ventas')
    .insert({
      local_id: local,
      fecha: semilla.fecha,
      estado: semilla.estado ?? 'cerrada',
      anulado: semilla.anulado ?? false,
      motivo_anulacion: semilla.anulado ? 'Prueba de reportes' : null,
      total_centavos: semilla.renglones.reduce((suma, r) => suma + subtotalDe(r), 0),
    })
    .select('id')
    .single();
  if (error) throw new Error(`No pude sembrar la venta: ${error.message}`);
  return data.id;
}

/** Una venta con sus renglones escrita directo, para leerla desde los reportes. */
export async function sembrarVentaConRenglones(semilla: SemillaConRenglones): Promise<string> {
  const local = await idDelLocalPrincipal(clienteSecretoDePruebas());
  const id = await insertarVenta(semilla, local);
  const renglones = semilla.renglones.map((r) => ({
    local_id: local,
    venta_id: id,
    producto_id: r.producto?.productoId ?? null,
    presentacion_id: r.producto?.presentacionId ?? null,
    descripcion: r.descripcion ?? r.producto?.texto ?? 'Sin nombre',
    cantidad: r.cantidad,
    precio_unitario_centavos: r.precioCentavos,
    subtotal_centavos: subtotalDe(r),
  }));
  const { error } = await clienteSecretoDePruebas().from('renglones_de_venta').insert(renglones);
  if (error) throw new Error(`No pude sembrar los renglones: ${error.message}`);
  return id;
}
