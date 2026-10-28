import { Avatar, InsigniaDeEstado, type Tono } from '@/components/panel/Insignias';
import {
  accionesDisponibles,
  estadoDeCuenta,
  type EstadoDeCuenta,
  type FilaDeUsuario,
} from '@/lib/usuarios/presentacion';
import { AccionesDeUsuario } from './AccionesDeUsuario';

const TONOS: Record<EstadoDeCuenta, Tono> = {
  Pendiente: 'ambar',
  Activa: 'esmeralda',
  Desactivada: 'pizarra',
  Rechazada: 'rosa',
};

// La franja del costado dice el estado de un vistazo, antes de leer la insignia.
const FRANJAS: Record<EstadoDeCuenta, string> = {
  Pendiente: 'border-l-amber-400',
  Activa: 'border-l-emerald-400',
  Desactivada: 'border-l-slate-300',
  Rechazada: 'border-l-rose-400',
};

const TARJETA =
  'flex flex-col gap-4 rounded-2xl border border-l-4 border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg';

export function TarjetaDeUsuario({ fila, yo }: { fila: FilaDeUsuario; yo: string }) {
  const cuenta = { id: fila.id, nombre: fila.nombre, email: fila.email };
  const estado = estadoDeCuenta(fila);
  return (
    <li className={`${TARJETA} ${FRANJAS[estado]}`}>
      <div className="flex items-center gap-3.5">
        <Avatar nombre={fila.nombre} grande />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-extrabold tracking-tight text-foreground">
            {fila.nombre}
          </p>
          <p className="truncate text-xs text-neutral-500">{fila.email}</p>
        </div>
        <InsigniaDeEstado tono={TONOS[estado]}>{estado}</InsigniaDeEstado>
      </div>
      <div className="border-t border-border pt-4">
        <AccionesDeUsuario
          cuenta={cuenta}
          rol={fila.rol}
          acciones={accionesDisponibles(fila, yo)}
        />
      </div>
    </li>
  );
}
