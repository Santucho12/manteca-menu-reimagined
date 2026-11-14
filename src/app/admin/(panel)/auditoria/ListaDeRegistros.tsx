import { ScrollText } from 'lucide-react';
import Link from 'next/link';
import { Chip } from '@/components/panel/Insignias';
import { ListaDelPanel, type Columna } from '@/components/panel/ListaDelPanel';
import { SinResultados } from '@/components/panel/SinResultados';
import {
  datoDelRegistro,
  fechaYHora,
  nombreDeAccion,
  nombreDelDato,
  personaDe,
  resumenDe,
  type Nombres,
  type RegistroDeAuditoria,
} from '@/lib/auditoria/textos';

type Props = { registros: RegistroDeAuditoria[]; nombres: Nombres; total: number };

const ENLACE =
  'text-xs font-semibold text-primary hover:underline underline-offset-4 whitespace-nowrap';

// "Gastos · Gasto · nombre": un solo texto, para que se lea (y se busque) de corrido.
function queEs(registro: RegistroDeAuditoria, nombres: Nombres): string {
  const { modulo, dato } = datoDelRegistro(registro);
  const nombre = nombreDelDato(registro, nombres);
  return `${modulo} · ${dato}${nombre ? ` · ${nombre}` : ''}`;
}

const Detalle = ({ registro }: { registro: RegistroDeAuditoria }) => (
  <Link href={`/admin/auditoria/${registro.id}`} className={ENLACE}>
    Ver el detalle
  </Link>
);

const columnas = (nombres: Nombres): Columna<RegistroDeAuditoria>[] => [
  {
    titulo: 'Fecha',
    celda: (r) => <span className="text-xs whitespace-nowrap">{fechaYHora(r.fecha)}</span>,
  },
  {
    titulo: 'Qué',
    celda: (r) => (
      <div className="space-y-1 max-w-[320px]">
        <p className="text-xs font-semibold">{queEs(r, nombres)}</p>
        {resumenDe(r) ? <p className="text-xs text-muted-foreground">{resumenDe(r)}</p> : null}
      </div>
    ),
  },
  {
    titulo: 'Persona',
    desde: 'lg',
    celda: (r) => <span className="text-xs">{personaDe(r.usuario_id, nombres)}</span>,
  },
  { titulo: 'Acción', celda: (r) => <Chip>{nombreDeAccion(r.accion)}</Chip> },
  { titulo: 'Detalle', alinear: 'der', celda: (r) => <Detalle registro={r} /> },
];

function Tarjeta({ registro, nombres }: { registro: RegistroDeAuditoria; nombres: Nombres }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm font-bold break-words">{queEs(registro, nombres)}</p>
        <Chip>{nombreDeAccion(registro.accion)}</Chip>
      </div>
      <p className="text-xs text-muted-foreground">
        {fechaYHora(registro.fecha)} · {personaDe(registro.usuario_id, nombres)}
      </p>
      {resumenDe(registro) ? <p className="text-xs">{resumenDe(registro)}</p> : null}
      <Detalle registro={registro} />
    </>
  );
}

/** Los registros de auditoria en la tabla de Plan Reminder Pro (y tarjetas en el celular). */
export function ListaDeRegistros({ registros, nombres, total }: Props) {
  if (registros.length === 0) {
    return <SinResultados titulo="Sin registros" texto="No hay registros para mostrar." />;
  }
  return (
    <ListaDelPanel
      etiqueta="Registros"
      icono={ScrollText}
      total={total}
      filas={registros}
      clave={(r) => String(r.id)}
      columnas={columnas(nombres)}
      tarjeta={(r) => <Tarjeta registro={r} nombres={nombres} />}
    />
  );
}
