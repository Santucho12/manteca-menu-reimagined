import { formatearPesosEnteros } from '../plata';
import type { PresentacionDelMenu } from './precios';

type PrecioDelFormulario = { presentacionId: string; monto: string; original: string };
type CategoriaConPrecios = {
  presentaciones: PresentacionDelMenu[];
  compartidos: (number | null)[];
};

export type PrecioQuePisa = {
  presentacion: string;
  propioCentavos: number;
  categoriaCentavos: number;
};

/**
 * Los precios que este guardado le pone propios a un producto que hasta ahora tomaba el de su
 * categoria: antes de guardarlos se pregunta (pedido 82). Cambiar uno que ya era propio no
 * pregunta, porque ya lo pisaba.
 */
export function preciosQuePisan(
  precios: PrecioDelFormulario[],
  categoria: CategoriaConPrecios,
): PrecioQuePisa[] {
  return precios.flatMap((precio) => {
    const i = categoria.presentaciones.findIndex((p) => p.id === precio.presentacionId);
    const compartido = categoria.compartidos[i] ?? null;
    const nuevo = precio.monto.trim() !== '' && precio.original.trim() === '';
    if (i < 0 || compartido === null || !nuevo) return [];
    return [
      {
        presentacion: categoria.presentaciones[i]!.nombre,
        propioCentavos: Number(precio.monto.trim()) * 100,
        categoriaCentavos: compartido,
      },
    ];
  });
}

export function textoDelPrecioQuePisa(precio: PrecioQuePisa): string {
  const propio = formatearPesosEnteros(precio.propioCentavos);
  return `${precio.presentacion}: ${propio} en lugar de ${formatearPesosEnteros(precio.categoriaCentavos)}`;
}
