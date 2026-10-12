import type { Metadata } from 'next';
import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import {
  diasConCierre,
  listarCierres,
  fondosAnteriores,
  personasDeCaja,
  primerDiaConCierre,
  toleranciaDeCaja,
} from '@/lib/caja/consultas';
import { diasSinCierre } from '@/lib/caja/dias';
import {
  enlaceDeControl,
  filtrosDeControl,
  opcionesDeEstado,
  type FiltrosDeControl,
  type ParametrosDeControl,
} from '@/lib/caja/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { montoParaEditar } from '@/lib/gastos/plata';
import { cantidadDePaginas } from '@/lib/usuarios/presentacion';
import { ListaDeCierres } from '../ListaDeCierres';
import { FormularioDeTolerancia } from './FormularioDeTolerancia';

export const metadata: Metadata = { title: 'Control de cierres' };

type Persona = { id: string; nombre: string };

function Filtros({ filtros, personas }: { filtros: FiltrosDeControl; personas: Persona[] }) {
  const quienes = personas.map((persona) => ({ valor: persona.id, texto: persona.nombre }));
  return (
    <form
      action="/admin/caja/control"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <Campo id="desde" name="desde" type="date" etiqueta="Desde" defaultValue={filtros.desde} />
      <Campo id="hasta" name="hasta" type="date" etiqueta="Hasta" defaultValue={filtros.hasta} />
      <CampoDeSeleccion
        id="persona"
        name="persona"
        etiqueta="Persona"
        opciones={[{ valor: '', texto: 'Todas' }, ...quienes]}
        defaultValue={filtros.personaId ?? ''}
      />
      <CampoDeSeleccion
        id="estado"
        name="estado"
        etiqueta="Estado"
        opciones={[{ valor: '', texto: 'Todos' }, ...opcionesDeEstado()]}
        defaultValue={filtros.estado ?? ''}
      />
      <Button type="submit">Filtrar</Button>
    </form>
  );
}

// Un dia sin cierre lleva a cargarlo: se puede cargar el de un dia anterior.
function DiasSinCierre({ dias }: { dias: string[] }) {
  if (dias.length === 0) return null;
  return (
    <ul aria-label="Días sin cierre" className="space-y-1">
      {dias.map((dia) => (
        <li key={dia} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">Sin cierre: {fechaParaMostrar(dia)}</span>
          <Link href={`/admin/caja?fecha=${dia}`} className="underline underline-offset-4">
            Cargarlo
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Paginas({
  filtros,
  total,
  hoy,
}: {
  filtros: FiltrosDeControl;
  total: number;
  hoy: string;
}) {
  const ultima = cantidadDePaginas(total);
  if (ultima === 1) return null;
  const a = (pagina: number) => enlaceDeControl({ ...filtros, pagina }, hoy);
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

async function datosDelControl(searchParams: Promise<ParametrosDeControl>) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const filtros = filtrosDeControl(await searchParams, hoy);
  const [lista, personas, tolerancia, conCierre, primero] = await Promise.all([
    listarCierres(cliente, filtros),
    personasDeCaja(cliente),
    toleranciaDeCaja(cliente),
    diasConCierre(cliente, filtros.desde, filtros.hasta),
    primerDiaConCierre(cliente),
  ]);
  const faltan = diasSinCierre({
    desde: filtros.desde,
    hasta: filtros.hasta,
    conCierre,
    primero,
    hoy,
  });
  const fondos = await fondosAnteriores(
    cliente,
    lista.filas.map((fila) => fila.id),
  );
  return { hoy, filtros, lista, personas, tolerancia, faltan, fondos };
}

export default async function ControlDeCierres({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeControl>;
}) {
  const { hoy, filtros, lista, personas, tolerancia, faltan, fondos } =
    await datosDelControl(searchParams);
  return (
    <div className="space-y-6">
      <TituloDePagina subtitulo="Los cierres de cada día, quién los cargó y si cierran.">
        Control de cierres
      </TituloDePagina>
      <Button asChild>
        <Link href="/admin/caja">Cargar cierre</Link>
      </Button>
      <FormularioDeTolerancia inicial={montoParaEditar(tolerancia)} />
      <Filtros filtros={filtros} personas={personas} />
      <DiasSinCierre dias={filtros.estado || filtros.personaId ? [] : faltan} />
      <ListaDeCierres filas={lista.filas} conPersona fondos={fondos} />
      <Paginas filtros={{ ...filtros, pagina: lista.pagina }} total={lista.total} hoy={hoy} />
    </div>
  );
}
