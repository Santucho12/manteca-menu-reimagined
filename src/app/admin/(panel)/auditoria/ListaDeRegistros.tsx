import Link from 'next/link';
import {
  datoDe,
  fechaYHora,
  nombreDeAccion,
  personaDe,
  resumenDe,
  type Nombres,
  type RegistroDeAuditoria,
} from '@/lib/auditoria/textos';

type Props = { registros: RegistroDeAuditoria[]; nombres: Nombres };

function Fila({ registro, nombres }: { registro: RegistroDeAuditoria; nombres: Nombres }) {
  const { modulo, dato } = datoDe(registro.tabla);
  const resumen = resumenDe(registro);
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 p-4">
      <div className="min-w-0 space-y-1">
        <p className="font-medium">
          {modulo} · {dato}
        </p>
        <p className="text-muted-foreground text-sm">
          {fechaYHora(registro.fecha)} · {personaDe(registro.usuario_id, nombres)}
        </p>
        {resumen ? <p className="text-sm">{resumen}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm">{nombreDeAccion(registro.accion)}</span>
        <Link
          href={`/admin/auditoria/${registro.id}`}
          className="text-sm underline underline-offset-4"
        >
          Ver el detalle
        </Link>
      </div>
    </li>
  );
}

export function ListaDeRegistros({ registros, nombres }: Props) {
  if (registros.length === 0)
    return <p className="text-muted-foreground">No hay registros para mostrar.</p>;
  return (
    <ul aria-label="Registros" className="bg-card divide-y rounded-xl border">
      {registros.map((registro) => (
        <Fila key={registro.id} registro={registro} nombres={nombres} />
      ))}
    </ul>
  );
}
