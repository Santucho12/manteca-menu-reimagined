import { Banknote } from 'lucide-react';
import Link from 'next/link';
import { Chip, InsigniaDeEstado, type Tono } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import type { FilaDeCierre } from '@/lib/caja/consultas';
import { diferenciaDeFondo } from '@/lib/caja/fondo';
import { nombreDeEstado, textoDeDiferencia, type EstadoDeCierre } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';

/** fondos: lo que quedo en el cierre anterior a cada uno; solo lo pide el control del admin. */
type Props = { filas: FilaDeCierre[]; conPersona?: boolean; fondos?: Map<string, number | null> };

const ENLACE =
  'text-xs font-semibold text-foreground hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors';

const TONOS: Record<EstadoDeCierre, Tono> = {
  esperando_ventas: 'ambar',
  cierra: 'esmeralda',
  con_diferencia: 'rosa',
  revisado: 'esmeralda',
  anulado: 'pizarra',
};

const Estado = ({ cierre }: { cierre: FilaDeCierre }) => (
  <InsigniaDeEstado tono={TONOS[cierre.estado]}>{nombreDeEstado(cierre.estado)}</InsigniaDeEstado>
);

const Fecha = ({ cierre }: { cierre: FilaDeCierre }) => (
  <Link href={`/admin/caja/cierres/${cierre.id}`} className={`${ENLACE} whitespace-nowrap`}>
    {fechaParaMostrar(cierre.fecha)}
  </Link>
);

// Bajar el fondo o inventar un retiro tapan un faltante: el control los deja a la vista.
function ParaControlar({ cierre, anterior }: { cierre: FilaDeCierre; anterior: number | null }) {
  const fondo = diferenciaDeFondo(cierre.fondoInicialCentavos, anterior);
  return (
    <span className="flex flex-wrap items-center gap-1">
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
  const control: Columna<FilaDeCierre>[] = conPersona
    ? [
        { titulo: 'Persona', celda: (c) => <span className="text-xs">{c.persona}</span> },
        {
          titulo: 'Control',
          desde: 'lg',
          celda: (c) => <ParaControlar cierre={c} anterior={fondos?.get(c.id) ?? null} />,
        },
      ]
    : [];
  return [
    { titulo: 'Fecha', celda: (c) => <Fecha cierre={c} /> },
    ...control,
    {
      titulo: 'Diferencia',
      celda: (c) => <span className="text-xs">{textoDeDiferencia(c.diferenciaTotalCentavos)}</span>,
    },
    { titulo: 'Estado', alinear: 'der', celda: (c) => <Estado cierre={c} /> },
  ] satisfies Columna<FilaDeCierre>[];
}

function Tarjeta({ cierre, conPersona }: { cierre: FilaDeCierre; conPersona: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Fecha cierre={cierre} />
          {conPersona ? <p className="text-xs text-muted-foreground">{cierre.persona}</p> : null}
        </div>
        <Estado cierre={cierre} />
      </div>
      <p className="text-xs">{textoDeDiferencia(cierre.diferenciaTotalCentavos)}</p>
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
      tarjeta={(c) => <Tarjeta cierre={c} conPersona={conPersona} />}
    />
  );
}
