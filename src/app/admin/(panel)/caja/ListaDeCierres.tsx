import { Banknote, ChevronRight } from 'lucide-react';
import { nombreDelTurno } from '@/lib/caja/turnos';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Chip, InsigniaDeEstado } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import type { FilaDeCierre } from '@/lib/caja/consultas';
import { diaDeLaSemana } from '@/lib/caja/diaDeLaSemana';
import { textoDeDiferenciaDeMedio } from '@/lib/caja/diferencias';
import { diferenciaDeFondo } from '@/lib/caja/fondo';
import { nombreDeEstado, tonoDelCierre } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import { cn } from '@/lib/utils';

/** fondos: lo que quedo en el cierre anterior a cada uno; solo lo pide el control del admin. */
type Props = { filas: FilaDeCierre[]; conPersona?: boolean; fondos?: Map<string, number | null> };

const ENLACE =
  'after:absolute after:inset-0 text-xs font-semibold text-foreground hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

const Estado = ({ cierre }: { cierre: FilaDeCierre }) => (
  <InsigniaDeEstado tono={tonoDelCierre(cierre)}>
    {cierre.anulado ? 'Anulado' : nombreDeEstado(cierre.estado)}
  </InsigniaDeEstado>
);

const EstadoConFlecha = ({ cierre }: { cierre: FilaDeCierre }) => (
  <span className="inline-flex items-center gap-3">
    <Estado cierre={cierre} />
    <ChevronRight size={16} aria-hidden="true" className="text-muted-foreground" />
  </span>
);

// Cada medio que no da exacto, por separado: un faltante y un sobrante no se compensan.
function Diferencia({ cierre }: { cierre: FilaDeCierre }) {
  if (cierre.diferencias.length === 0) {
    return <span className="text-sm font-semibold text-emerald-700">Sin diferencia</span>;
  }
  return (
    <span className="block space-y-0.5 text-left">
      {cierre.diferencias.map((diferencia) => (
        <span
          key={diferencia.medio}
          className={cn(
            'block text-sm font-bold',
            diferencia.centavos < 0 ? 'text-rose-600' : 'text-amber-700',
          )}
        >
          {textoDeDiferenciaDeMedio(diferencia)}
        </span>
      ))}
    </span>
  );
}

const Empleado = ({ nombre, children }: { nombre: string; children?: ReactNode }) => (
  <span className="inline-flex items-center gap-3 text-left">
    <span
      aria-hidden="true"
      className="size-8 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-black uppercase"
    >
      {nombre.charAt(0)}
    </span>
    <span className="space-y-0.5">
      <span className="block text-sm font-semibold">{nombre}</span>
      {children}
    </span>
  </span>
);

const Fecha = ({ cierre }: { cierre: FilaDeCierre }) => (
  <span className="flex items-center gap-3">
    <span className="w-9 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
      {diaDeLaSemana(cierre.fecha)}
    </span>
    <Link
      href={`/admin/caja/cierres/${cierre.id}`}
      className={`${ENLACE} font-display text-sm font-bold whitespace-nowrap`}
    >
      {fechaParaMostrar(cierre.fecha)}
    </Link>
    <span className="text-xs font-semibold text-muted-foreground">
      {nombreDelTurno(cierre.turno)}
    </span>
  </span>
);

// Bajar el fondo o inventar un retiro tapan un faltante: el control los deja a la vista.
function ParaControlar({ cierre, anterior }: { cierre: FilaDeCierre; anterior: number | null }) {
  const fondo = diferenciaDeFondo(cierre.fondoInicialCentavos, anterior);
  return (
    <span className="flex flex-wrap items-center gap-1 empty:hidden">
      {cierre.retirosCentavos > 0 ? (
        <span className="text-xs text-muted-foreground">
          Retiros: {formatearPesos(cierre.retirosCentavos)}
        </span>
      ) : null}
      {fondo ? <Chip>Fondo distinto</Chip> : null}
    </span>
  );
}

function columnas(conPersona: boolean, fondos?: Map<string, number | null>) {
  const empleado: Columna<FilaDeCierre>[] = conPersona
    ? [
        {
          titulo: 'Empleado',
          alinear: 'centro',
          celda: (c) => (
            <Empleado nombre={c.persona}>
              <ParaControlar cierre={c} anterior={fondos?.get(c.id) ?? null} />
            </Empleado>
          ),
        },
      ]
    : [];
  return [
    { titulo: 'Fecha', celda: (c) => <Fecha cierre={c} /> },
    ...empleado,
    {
      titulo: 'Diferencia',
      alinear: 'centro',
      celda: (c) => <Diferencia cierre={c} />,
    },
    { titulo: 'Estado', alinear: 'der', celda: (c) => <EstadoConFlecha cierre={c} /> },
  ] satisfies Columna<FilaDeCierre>[];
}

function Tarjeta({
  cierre,
  conPersona,
  anterior,
}: {
  cierre: FilaDeCierre;
  conPersona: boolean;
  anterior: number | null;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Fecha cierre={cierre} />
          {conPersona ? <p className="text-xs text-muted-foreground">{cierre.persona}</p> : null}
          {conPersona ? <ParaControlar cierre={cierre} anterior={anterior} /> : null}
        </div>
        <Estado cierre={cierre} />
      </div>
      <Diferencia cierre={cierre} />
    </>
  );
}

/** Los cierres de caja en la tabla de Plan Reminder Pro (y tarjetas en el celular). */
export function ListaDeCierres({ filas, conPersona = false, fondos }: Props) {
  if (filas.length === 0) {
    return <SinResultados titulo="Sin cierres" texto="No hay cierres para mostrar." />;
  }
  return (
    <ListaDelPanel
      etiqueta="Cierres"
      icono={Banknote}
      total={filas.length}
      filas={filas}
      clave={(c) => c.id}
      columnas={columnas(conPersona, fondos)}
      tarjeta={(c) => (
        <Tarjeta cierre={c} conPersona={conPersona} anterior={fondos?.get(c.id) ?? null} />
      )}
    />
  );
}
