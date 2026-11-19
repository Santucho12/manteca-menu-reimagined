import Link from 'next/link';
import { nombreDelTurno, type Turno } from '@/lib/caja/turnos';

const TURNOS: Turno[] = [1, 2];

/**
 * El turno del cierre. Al cargar, cada turno es un enlace: cambia el fondo sugerido, que se lee
 * en el servidor. Al editar solo se muestra: el turno no se cambia, se anula y se carga de nuevo.
 */
export function ElegirTurno({
  fecha,
  turno,
  fijo,
}: {
  fecha: string;
  turno: Turno;
  fijo?: boolean;
}) {
  if (fijo) return <p className="text-sm font-semibold">Turno: {nombreDelTurno(turno)}</p>;
  return (
    <nav aria-label="Turno del cierre" className="flex flex-wrap gap-2">
      {TURNOS.map((opcion) => (
        <Link
          key={opcion}
          href={`/admin/caja?fecha=${fecha}&turno=${opcion}`}
          aria-current={opcion === turno ? 'page' : undefined}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
            opcion === turno
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card hover:bg-muted'
          }`}
        >
          Cierre {opcion === 1 ? 'del mediodía' : 'de la noche'}
        </Link>
      ))}
    </nav>
  );
}
