import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LISTA_DE_DESPLEGABLE,
  OPCION_DE_DESPLEGABLE,
} from '@/components/panel/estiloDeDesplegable';
import type { Rol } from '@/lib/acceso/estados';
import { nombreDeRol, type AccionDeUsuario } from '@/lib/usuarios/presentacion';

type Props = {
  rol: Rol;
  deshabilitado: boolean;
  alElegir: (accion: AccionDeUsuario) => void;
};

// Solo Caja y Admin se asignan desde la pantalla; el encargado existe pero no se elige.
const ACCION_DE: Record<string, AccionDeUsuario> = {
  invitado: 'darPendiente',
  caja: 'darCaja',
  admin: 'darAdmin',
};

/** El rol de la cuenta en un desplegable: elegir otro lo asigna en el momento. */
export function SelectorDeRol({ rol, deshabilitado, alElegir }: Props) {
  return (
    <Select
      value={rol}
      disabled={deshabilitado}
      onValueChange={(valor) => alElegir(ACCION_DE[valor]!)}
    >
      <SelectTrigger
        aria-label="Rol"
        className="h-10 w-40 rounded-xl text-sm font-bold focus:ring-0 focus:ring-offset-0 focus:border-border data-[state=open]:border-border"
      >
        <SelectValue placeholder="Elegí un rol" />
      </SelectTrigger>
      <SelectContent
        side="right"
        align="start"
        sideOffset={44}
        className={`${LISTA_DE_DESPLEGABLE} shadow-2xl shadow-slate-900/10`}
      >
        {rol === 'encargado' ? (
          <SelectItem value="encargado" disabled className={OPCION_DE_DESPLEGABLE}>
            {nombreDeRol('encargado')}
          </SelectItem>
        ) : null}
        <SelectItem value="invitado" className={OPCION_DE_DESPLEGABLE}>
          Pendiente
        </SelectItem>
        <SelectItem value="caja" className={OPCION_DE_DESPLEGABLE}>
          Caja
        </SelectItem>
        <SelectItem value="admin" className={OPCION_DE_DESPLEGABLE}>
          Admin
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
