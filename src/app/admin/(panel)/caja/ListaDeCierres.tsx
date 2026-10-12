import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { FilaDeCierre } from '@/lib/caja/consultas';
import { diferenciaDeFondo } from '@/lib/caja/fondo';
import { nombreDeEstado, textoDeDiferencia } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';

/** fondos: lo que quedo en el cierre anterior a cada uno; solo lo pide el control del admin. */
type Props = { filas: FilaDeCierre[]; conPersona?: boolean; fondos?: Map<string, number | null> };

// Bajar el fondo o inventar un retiro tapan un faltante: el control los deja a la vista.
function ParaControlar({ cierre, anterior }: { cierre: FilaDeCierre; anterior: number | null }) {
  const fondo = diferenciaDeFondo(cierre.fondoInicialCentavos, anterior);
  return (
    <>
      {cierre.retirosCentavos > 0 ? (
        <span className="text-muted-foreground text-sm">
          Retiros: {formatearPesos(cierre.retirosCentavos)}
        </span>
      ) : null}
      {fondo ? <Badge variant="outline">Fondo distinto</Badge> : null}
    </>
  );
}

function Fila({
  cierre,
  conPersona,
  anterior,
}: {
  cierre: FilaDeCierre;
  conPersona: boolean;
  anterior: number | null;
}) {
  const atencion = cierre.estado === 'con_diferencia';
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/admin/caja/cierres/${cierre.id}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {fechaParaMostrar(cierre.fecha)}
        </Link>
        {conPersona ? <p className="text-muted-foreground text-sm">{cierre.persona}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {conPersona ? <ParaControlar cierre={cierre} anterior={anterior} /> : null}
        <span className="text-sm">{textoDeDiferencia(cierre.diferenciaTotalCentavos)}</span>
        <Badge variant={atencion ? 'destructive' : 'outline'}>
          {nombreDeEstado(cierre.estado)}
        </Badge>
      </div>
    </li>
  );
}

export function ListaDeCierres({ filas, conPersona = false, fondos }: Props) {
  if (filas.length === 0)
    return <p className="text-muted-foreground">No hay cierres para mostrar.</p>;
  return (
    <ul aria-label="Cierres" className="bg-card divide-y rounded-xl border">
      {filas.map((cierre) => (
        <Fila
          key={cierre.id}
          cierre={cierre}
          conPersona={conPersona}
          anterior={fondos?.get(cierre.id) ?? null}
        />
      ))}
    </ul>
  );
}
