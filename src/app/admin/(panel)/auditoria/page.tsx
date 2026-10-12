import type { Metadata } from 'next';
import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { listarRegistros, nombresDe, personasDeAuditoria } from '@/lib/auditoria/consultas';
import {
  enlaceDeAuditoria,
  filtrosDeAuditoria,
  opcionesDeAccion,
  opcionesDeModulo,
  type FiltrosDeAuditoria,
  type ParametrosDeAuditoria,
} from '@/lib/auditoria/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeRegistros } from './ListaDeRegistros';

export const metadata: Metadata = { title: 'Auditoría' };

type Persona = { id: string; nombre: string };

function Filtros({ filtros, personas }: { filtros: FiltrosDeAuditoria; personas: Persona[] }) {
  const quienes = personas.map((persona) => ({ valor: persona.id, texto: persona.nombre }));
  return (
    <form
      action="/admin/auditoria"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
    >
      <Campo id="desde" name="desde" type="date" etiqueta="Desde" defaultValue={filtros.desde} />
      <Campo id="hasta" name="hasta" type="date" etiqueta="Hasta" defaultValue={filtros.hasta} />
      <CampoDeSeleccion
        id="persona"
        name="persona"
        etiqueta="Persona"
        opciones={[
          { valor: '', texto: 'Todas' },
          { valor: 'sistema', texto: 'El sistema' },
          ...quienes,
        ]}
        defaultValue={filtros.persona ?? ''}
      />
      <CampoDeSeleccion
        id="modulo"
        name="modulo"
        etiqueta="Módulo"
        opciones={[{ valor: '', texto: 'Todos' }, ...opcionesDeModulo()]}
        defaultValue={filtros.modulo ?? ''}
      />
      <CampoDeSeleccion
        id="accion"
        name="accion"
        etiqueta="Acción"
        opciones={[{ valor: '', texto: 'Todas' }, ...opcionesDeAccion()]}
        defaultValue={filtros.accion ?? ''}
      />
      <Button type="submit">Filtrar</Button>
    </form>
  );
}

type PropsDePaginas = { filtros: FiltrosDeAuditoria; total: number; hoy: string };

function Paginas({ filtros, total, hoy }: PropsDePaginas) {
  const ultima = cantidadDePaginas(total);
  if (ultima === 1) return null;
  const a = (pagina: number) => enlaceDeAuditoria({ ...filtros, pagina }, hoy);
  return (
    <nav aria-label="Páginas" className="flex items-center gap-4 text-sm">
      {filtros.pagina > 1 ? <Link href={a(filtros.pagina - 1)}>Anterior</Link> : null}
      <span>
        Página {filtros.pagina} de {ultima}
      </span>
      {filtros.pagina < ultima ? <Link href={a(filtros.pagina + 1)}>Siguiente</Link> : null}
    </nav>
  );
}

export default async function PaginaDeAuditoria({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeAuditoria>;
}) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeAuditoria(await searchParams, hoy);
  const [lista, personas] = await Promise.all([
    listarRegistros(cliente, filtros),
    personasDeAuditoria(cliente),
  ]);
  const nombres = await nombresDe(cliente, lista.filas);
  return (
    <div className="space-y-6">
      <TituloDePagina subtitulo="Lo que se cargó, cambió o anuló, y quién lo hizo.">
        Auditoría
      </TituloDePagina>
      <p className="text-muted-foreground max-w-xl text-sm">
        Todo lo que se cargó, cambió, anuló o desactivó, y quién lo hizo. No se puede editar ni
        borrar.
      </p>
      <Filtros filtros={filtros} personas={personas} />
      <ListaDeRegistros registros={lista.filas} nombres={nombres} />
      <Paginas filtros={{ ...filtros, pagina: lista.pagina }} total={lista.total} hoy={hoy} />
    </div>
  );
}
