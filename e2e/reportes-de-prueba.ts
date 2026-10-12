import { borrarCierres, sembrarCierre } from '../tests/cierres-de-prueba';
import {
  borrarCategoriasConSusGastos,
  sembrarCategoriaDeGasto,
  sembrarGasto,
} from '../tests/gastos-de-prueba';
import { sembrarVentaConRenglones } from '../tests/reportes-de-prueba';
import { borrarVentas, productoParaVender, type ParaVender } from '../tests/ventas-de-prueba';

/** Abril de 2018: un periodo que no siembra ningun otro test. */
export const PERIODO_E2E = { desde: '2018-04-01', hasta: '2018-04-30' };
export type SiembraDeReportes = {
  a: ParaVender;
  b: ParaVender;
  ventas: string[];
  categorias: { id: string; nombre: string }[];
  cierres: string[];
};

const deA = (a: ParaVender, cantidad: number, precioCentavos = 150000) => [
  { producto: a, cantidad, precioCentavos },
];

// Abril: $5.000 en dos ventas y una cancelada que no cuenta. El 15 de marzo cae en el periodo
// anterior del mismo largo (2 al 31 de marzo) y deja $2.500 para comparar.
function sembrarVentas(a: ParaVender, b: ParaVender) {
  return Promise.all([
    sembrarVentaConRenglones({
      fecha: '2018-04-03',
      renglones: [...deA(a, 2), { producto: b, cantidad: 1, precioCentavos: 50000 }],
    }),
    sembrarVentaConRenglones({ fecha: '2018-04-03', renglones: deA(a, 1) }),
    sembrarVentaConRenglones({ fecha: '2018-04-04', estado: 'cancelada', renglones: deA(a, 5) }),
    sembrarVentaConRenglones({ fecha: '2018-03-15', renglones: deA(a, 1, 250000) }),
  ]);
}

async function sembrarGastos() {
  const categorias = await Promise.all([sembrarCategoriaDeGasto(), sembrarCategoriaDeGasto()]);
  await Promise.all([
    sembrarGasto({ categoriaId: categorias[0]!.id, fecha: '2018-04-03', montoCentavos: 100000 }),
    sembrarGasto({ categoriaId: categorias[1]!.id, fecha: '2018-04-04', montoCentavos: 70000 }),
  ]);
  return categorias;
}

export async function sembrarReportes(): Promise<SiembraDeReportes> {
  const [a, b] = await Promise.all([productoParaVender(), productoParaVender()]);
  const [ventas, categorias, c1, c2] = await Promise.all([
    sembrarVentas(a, b),
    sembrarGastos(),
    sembrarCierre({ fecha: '2018-04-10' }),
    sembrarCierre({ fecha: '2018-04-12' }),
  ]);
  return { a, b, ventas, categorias, cierres: [c1.id, c2.id] };
}

export async function borrarReportes(s: SiembraDeReportes) {
  await Promise.all([
    borrarVentas(s.ventas, { categoriasDelMenu: [s.a.categoriaId, s.b.categoriaId] }),
    borrarCategoriasConSusGastos(s.categorias.map((c) => c.id)),
    borrarCierres(s.cierres),
  ]);
}
