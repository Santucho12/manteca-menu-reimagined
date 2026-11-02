import { randomUUID } from 'node:crypto';
import { diaEnArgentina } from '../src/lib/fechas';
import { sumarDias } from '../src/lib/reportes/periodos';
import {
  borrarCierres,
  diaLibre,
  sembrarCierre,
  sembrarCierreConSalidas,
} from '../tests/cierres-de-prueba';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
  sembrarPorPagar,
} from '../tests/gastos-de-prueba';
import { borrarProveedores, sembrarProveedor } from '../tests/proveedores-de-prueba';
import { sembrarVentaConRenglones } from '../tests/reportes-de-prueba';
import {
  borrarVentas,
  productoParaVender,
  sembrarCanal,
  sembrarVentaConPago,
} from '../tests/ventas-de-prueba';

/** Mayo de 2015: un periodo que no siembra ningun otro test; abril queda para comparar. */
export const MAYO_2015 = { desde: '2015-05-01', hasta: '2015-05-31' };

// Once cierres seguidos: el grafico de Caja tiene que mostrar mas de diez.
const DIAS_CON_CIERRE = Array.from(
  { length: 11 },
  (_, i) => `2015-05-${String(i + 1).padStart(2, '0')}`,
);

export type SiembraDeMillones = {
  ventas: string[];
  categoriasDelMenu: string[];
  categoriasDeGasto: string[];
  cierres: string[];
};

// $12.000.000 en mayo contra $13.134.100 en abril, y una venta en efectivo de $1.626.500 que
// deja al cierre de ese dia con una diferencia de millones.
function sembrarVentas(a: Awaited<ReturnType<typeof productoParaVender>>, b: typeof a) {
  return Promise.all([
    sembrarVentaConRenglones({
      fecha: '2015-05-03',
      renglones: [
        { producto: a, cantidad: 800, precioCentavos: 1500000 },
        { producto: b, cantidad: 3, precioCentavos: 1234500 },
      ],
    }),
    sembrarVentaConRenglones({
      fecha: '2015-04-03',
      renglones: [{ producto: a, cantidad: 1, precioCentavos: 1313410000 }],
    }),
    sembrarVentaConPago({ fecha: '2015-05-02', medio: 'efectivo', centavos: 162650000 }),
  ]);
}

/** Montos de millones, como los de un mes real: son los que no entran en un celular angosto. */
export async function sembrarReportesDeMillones(): Promise<SiembraDeMillones> {
  const [a, b] = await Promise.all([productoParaVender(), productoParaVender()]);
  const categoria = await sembrarCategoriaDeGasto();
  const [ventas, cierres] = await Promise.all([
    sembrarVentas(a, b),
    Promise.all(DIAS_CON_CIERRE.map((fecha) => sembrarCierre({ fecha }))),
    sembrarGasto({ categoriaId: categoria.id, fecha: '2015-05-04', montoCentavos: 600000000 }),
  ]);
  return {
    ventas,
    categoriasDelMenu: [a.categoriaId, b.categoriaId],
    categoriasDeGasto: [categoria.id],
    cierres: cierres.map((c) => c.id),
  };
}

export async function borrarReportesDeMillones(s: SiembraDeMillones) {
  await Promise.all([
    borrarVentas(s.ventas, { categoriasDelMenu: s.categoriasDelMenu }),
    borrarCategoriasConSusGastos(s.categoriasDeGasto),
    borrarCierres(s.cierres),
  ]);
}

export type SiembraDeNombresLargos = {
  categoria: { id: string; nombre: string };
  proveedor: { id: string; nombre: string };
};

/** Un gasto de este año con una descripcion larga, de una categoria y un proveedor propios. */
export async function sembrarNombresLargos(): Promise<SiembraDeNombresLargos> {
  const [categoria, proveedor] = await Promise.all([sembrarCategoriaDeGasto(), sembrarProveedor()]);
  await sembrarGasto({
    categoriaId: categoria.id,
    proveedorId: proveedor.id,
    fecha: '2026-02-14',
    montoCentavos: 123456789,
    descripcion: 'Azúcar, chocolate, dulce de leche y crema pastelera para la semana',
  });
  return { categoria, proveedor };
}

export async function borrarNombresLargos(s: SiembraDeNombresLargos) {
  // Primero el gasto: apunta al proveedor.
  await borrarCategoriasConSusGastos([s.categoria.id]);
  await borrarProveedores([s.proveedor.id]);
}

// Un sufijo corto: los nombres de categorias, proveedores y canales no se repiten en el local.
const conSufijo = (texto: string) => `${texto} ${randomUUID().slice(0, 4)}`;

export const TEXTOS_LARGOS = {
  producto: conSufijo('Medialuna de manteca rellena de dulce de leche y crema'),
  categoria: conSufijo('Mantenimiento de la cámara de frío y las heladeras'),
  porPagar: 'Reparación completa de la cámara de frío del depósito del fondo',
  proveedor: conSufijo('Distribuidora de Lácteos y Quesos del Valle Calchaquí'),
  queCompra: 'Manteca, crema de leche, quesos duros y ricota para los rellenos',
  canal: conSufijo('Pedidos por WhatsApp para eventos y empresas'),
  paraClasificar: 'Bolsas de hielo, servilletas y vasos descartables para el mostrador',
};

export type SiembraDeTextosLargos = {
  venta: string;
  categoriaDelMenu: string;
  categoriaDeGasto: string;
  cierre: string;
  proveedor: string;
  canal: string;
};

/** Hoy: una venta grande, un gasto y algo por pagar, con textos largos. */
async function sembrarDeHoy(
  producto: Awaited<ReturnType<typeof productoParaVender>>,
  categoriaId: string,
) {
  const hoy = diaEnArgentina(new Date());
  return Promise.all([
    sembrarVentaConRenglones({
      fecha: hoy,
      renglones: [{ producto, cantidad: 3, precioCentavos: 990000000 }],
    }),
    sembrarGasto({ categoriaId, fecha: hoy, montoCentavos: 250000000 }),
    sembrarPorPagar({
      categoriaId,
      descripcion: TEXTOS_LARGOS.porPagar,
      vencimiento: sumarDias(hoy, 3),
    }),
  ]);
}

/** Nombres y descripciones largas en cada lista que antes los cortaba con puntos suspensivos. */
export async function sembrarTextosLargos(): Promise<SiembraDeTextosLargos> {
  const [producto, categoria, proveedor, canal, cierre] = await Promise.all([
    productoParaVender(true, TEXTOS_LARGOS.producto),
    sembrarCategoriaDeGasto({ nombre: TEXTOS_LARGOS.categoria }),
    sembrarProveedor({ nombre: TEXTOS_LARGOS.proveedor, queCompra: TEXTOS_LARGOS.queCompra }),
    sembrarCanal(true, TEXTOS_LARGOS.canal),
    // Un gasto pagado con la caja queda "para clasificar": la base no deja cargarlo de otra forma.
    sembrarCierreConSalidas(diaLibre(), TEXTOS_LARGOS.paraClasificar),
  ]);
  const [venta] = await sembrarDeHoy(producto, categoria.id);
  return {
    venta,
    categoriaDelMenu: producto.categoriaId,
    categoriaDeGasto: categoria.id,
    cierre,
    proveedor: proveedor.id,
    canal: canal.id,
  };
}

export async function borrarTextosLargos(s: SiembraDeTextosLargos) {
  await Promise.all([
    borrarVentas([s.venta], { canales: [s.canal], categoriasDelMenu: [s.categoriaDelMenu] }),
    borrarCategoriasConSusGastos([s.categoriaDeGasto]),
    borrarCierres([s.cierre]),
    borrarProveedores([s.proveedor]),
  ]);
}
