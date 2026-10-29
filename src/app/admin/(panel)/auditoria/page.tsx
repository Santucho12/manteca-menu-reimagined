import type { Metadata } from 'next';
import { Paginas } from '@/components/panel/Paginas';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { listarRegistros, nombresDe, personasDeAuditoria } from '@/lib/auditoria/consultas';
import {
  enlaceDeAuditoria,
  filtrosDeAuditoria,
  type ParametrosDeAuditoria,
} from '@/lib/auditoria/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { FiltrosDeAuditoria } from './FiltrosDeAuditoria';
import { ListaDeRegistros } from './ListaDeRegistros';

export const metadata: Metadata = { title: 'Auditoría' };

export default async function PaginaDeAuditoria({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeAuditoria>;
}) {
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeAuditoria(await searchParams, hoy);
  const { cliente, datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([listarRegistros(cliente, filtros), personasDeAuditoria(cliente)]),
  );
  const [lista, personas] = datos;
  const nombres = await nombresDe(cliente, lista.filas);
  return (
    <Pantalla
      titulo="Auditoría"
      subtitulo="Todo lo que se cargó, cambió, anuló o desactivó, y quién lo hizo. No se puede editar ni borrar."
      ayuda="auditoria"
    >
      <FiltrosDeAuditoria filtros={filtros} personas={personas} />
      <ListaDeRegistros registros={lista.filas} nombres={nombres} total={lista.total} />
      <Paginas
        pagina={lista.pagina}
        ultima={cantidadDePaginas(lista.total)}
        enlaceA={(pagina) => enlaceDeAuditoria({ ...filtros, pagina }, hoy)}
      />
    </Pantalla>
  );
}
