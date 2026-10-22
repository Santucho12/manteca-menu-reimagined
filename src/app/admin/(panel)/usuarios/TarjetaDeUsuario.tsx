import { Avatar, Chip, InsigniaDeEstado, type Tono } from '@/components/panel/Insignias';
import { TARJETA_DE_SECCION } from '@/components/panel/estilos';
import {
  accionesDisponibles,
  estadoDeCuenta,
  nombreDeRol,
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

export function TarjetaDeUsuario({ fila, yo }: { fila: FilaDeUsuario; yo: string }) {
  const cuenta = { id: fila.id, nombre: fila.nombre, email: fila.email };
  const estado = estadoDeCuenta(fila);
  return (
    <li className={`${TARJETA_DE_SECCION} space-y-4`}>
      <div className="flex items-start gap-3">
        <Avatar nombre={fila.nombre} grande />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{fila.nombre}</span>
            <Chip>{nombreDeRol(fila.rol)}</Chip>
            <InsigniaDeEstado tono={TONOS[estado]}>{estado}</InsigniaDeEstado>
          </div>
          <p className="text-xs text-muted-foreground break-all">{fila.email}</p>
        </div>
      </div>
      <AccionesDeUsuario cuenta={cuenta} acciones={accionesDisponibles(fila, yo)} />
    </li>
  );
}
