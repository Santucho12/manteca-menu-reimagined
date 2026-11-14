import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { BarraDeFiltros, Buscador, FiltroEnlace } from '@/components/panel/Filtros';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { pagadoPorProveedor, porPagarPorProveedor } from '@/lib/gastos/proveedores';
import { listarProveedores } from '@/lib/proveedores/consultas';
import {
  enlaceDeProveedores,
  filasConPagado,
  filtrosDeProveedores,
  type ParametrosDeProveedores,
} from '@/lib/proveedores/pantalla';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeProveedores } from './ListaDeProveedores';

export const metadata: Metadata = { title: 'Proveedores' };

export default async function PaginaDeProveedores({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeProveedores>;
}) {
  const filtros = filtrosDeProveedores(await searchParams);
  const hoy = diaEnArgentina(new Date());
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([
      listarProveedores(cliente, filtros),
      pagadoPorProveedor(cliente, hoy),
      porPagarPorProveedor(cliente),
    ]),
  );
  const [lista, pagado, porPagar] = datos;
  const otroEstado = enlaceDeProveedores({
    ...filtros,
    desactivados: !filtros.desactivados,
    pagina: 1,
  });
  const nuevo = (
    <Link href="/admin/proveedores/nuevo" className={BOTON_DE_ENCABEZADO}>
      <Plus size={18} aria-hidden="true" /> Nuevo proveedor
    </Link>
  );
  return (
    <Pantalla
      titulo={filtros.desactivados ? 'Proveedores desactivados' : 'Proveedores'}
      subtitulo="A quién le comprás, cómo contactarlo, cuánto le pagaste y cuánto le debés."
      acciones={nuevo}
      ayuda="proveedores"
    >
      <BarraDeFiltros
        accion="/admin/proveedores"
        ocultos={filtros.desactivados ? { desactivados: '1' } : {}}
      >
        <Buscador etiqueta="Buscar por nombre" valor={filtros.busqueda} />
        <div className="flex flex-wrap gap-2 md:gap-3">
          <FiltroEnlace href={otroEstado} prendido={filtros.desactivados}>
            {filtros.desactivados ? 'Ver activos' : 'Ver desactivados'}
          </FiltroEnlace>
        </div>
      </BarraDeFiltros>
      <ListaDeProveedores
        filas={filasConPagado(lista.filas, pagado, porPagar)}
        total={lista.total}
        filtros={filtros}
      />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeProveedores({ ...filtros, pagina })}
      />
    </Pantalla>
  );
}
