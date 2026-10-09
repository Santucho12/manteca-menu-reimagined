import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { FilaDeCierre } from '@/lib/caja/consultas';
import { nombreDeEstado, textoDeDiferencia } from '@/lib/caja/pantalla';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';

type Props = { filas: FilaDeCierre[]; conPersona?: boolean };

function Fila({ cierre, conPersona }: { cierre: FilaDeCierre; conPersona: boolean }) {
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
        <span className="text-sm">{textoDeDiferencia(cierre.diferenciaTotalCentavos)}</span>
        <Badge variant={atencion ? 'destructive' : 'outline'}>
          {nombreDeEstado(cierre.estado)}
        </Badge>
      </div>
    </li>
  );
}

export function ListaDeCierres({ filas, conPersona = false }: Props) {
  if (filas.length === 0)
    return <p className="text-muted-foreground">No hay cierres para mostrar.</p>;
  return (
    <ul aria-label="Cierres" className="bg-card divide-y rounded-xl border">
      {filas.map((cierre) => (
        <Fila key={cierre.id} cierre={cierre} conPersona={conPersona} />
      ))}
    </ul>
  );
}
