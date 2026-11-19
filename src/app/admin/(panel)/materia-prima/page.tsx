import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';
import { BarraDeFiltros, Buscador, FiltroEnlace } from '@/components/panel/Filtros';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { listarInsumos } from '@/lib/materia-prima/consultas';
import {
  enlaceDeInsumos,
  filtrosDeInsumos,
  type ParametrosDeInsumos,
} from '@/lib/materia-prima/pantalla';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeInsumos } from './ListaDeInsumos';

export const metadata: Metadata = { title: 'Materia prima' };

const Nuevo = () => (
  <Link href="/admin/materia-prima/nuevo" className={BOTON_DE_ENCABEZADO}>
    <Plus size={18} aria-hidden="true" /> Nuevo insumo
  </Link>
);

export default async function PaginaDeMateriaPrima({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeInsumos>;
}) {
  const filtros = filtrosDeInsumos(await searchParams);
  const { datos: lista } = await exigirPaginaYLeer('admin', (cliente) =>
    listarInsumos(cliente, filtros),
  );
  const otroEstado = enlaceDeInsumos({
    ...filtros,
    desactivados: !filtros.desactivados,
    pagina: 1,
  });
  return (
    <Pantalla
      titulo={filtros.desactivados ? 'Insumos desactivados' : 'Materia prima'}
      subtitulo="Los insumos que usás y lo que cuesta cada uno hoy."
      acciones={<Nuevo />}
      ayuda="materia-prima"
    >
      <BarraDeFiltros
        accion="/admin/materia-prima"
        ocultos={filtros.desactivados ? { desactivados: '1' } : {}}
      >
        <Buscador etiqueta="Buscar por nombre" valor={filtros.busqueda} />
        <div className="flex flex-wrap gap-2 md:gap-3">
          <FiltroEnlace href={otroEstado} prendido={filtros.desactivados}>
            {filtros.desactivados ? 'Ver activos' : 'Ver desactivados'}
          </FiltroEnlace>
        </div>
      </BarraDeFiltros>
      <ListaDeInsumos filas={lista.filas} total={lista.total} filtros={filtros} />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeInsumos({ ...filtros, pagina })}
      />
    </Pantalla>
  );
}
