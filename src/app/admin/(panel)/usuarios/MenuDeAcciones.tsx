import { DropdownMenu } from 'radix-ui';
import { MoreVertical } from 'lucide-react';
import { LISTA_DE_DESPLEGABLE } from '@/components/panel/estiloDeDesplegable';
import { ETIQUETAS_DE_ACCION, type AccionDeUsuario } from '@/lib/usuarios/presentacion';

type Props = {
  acciones: AccionDeUsuario[];
  deshabilitado: boolean;
  alElegir: (accion: AccionDeUsuario) => void;
};

const OPCION =
  'cursor-pointer rounded-xl px-3 py-2.5 text-sm font-bold outline-hidden data-[highlighted]:bg-secondary';

/** Las acciones menos frecuentes de una cuenta, detrás de los tres puntitos. */
export function MenuDeAcciones({ acciones, deshabilitado, alElegir }: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Más acciones"
        disabled={deshabilitado}
        className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
      >
        <MoreVertical size={18} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className={`${LISTA_DE_DESPLEGABLE} z-50 border`}
        >
          {acciones.map((accion) => (
            <DropdownMenu.Item key={accion} className={OPCION} onSelect={() => alElegir(accion)}>
              {ETIQUETAS_DE_ACCION[accion]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
