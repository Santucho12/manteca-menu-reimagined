'use client';

import { DropdownMenu } from 'radix-ui';
import { ChevronDown, Cookie, FolderPlus, Plus } from 'lucide-react';
import Link from 'next/link';
import { LISTA_DE_DESPLEGABLE } from '@/components/panel/estiloDeDesplegable';
import { BOTON_DE_ENCABEZADO } from '@/components/panel/estilos';

const OPCIONES = [
  {
    href: '/admin/menu/categorias/nueva',
    titulo: 'Categoría',
    detalle: 'Para agrupar productos',
    Icono: FolderPlus,
  },
  {
    href: '/admin/menu/productos/nuevo',
    titulo: 'Producto',
    detalle: 'Con sus precios',
    Icono: Cookie,
  },
];

const OPCION =
  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 outline-hidden data-[highlighted]:bg-secondary';

/** Un solo botón para crear: pregunta si es una categoría o un producto. */
export function BotonNuevo() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={BOTON_DE_ENCABEZADO}>
        <Plus size={18} aria-hidden="true" /> Nuevo
        <ChevronDown size={16} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className={`${LISTA_DE_DESPLEGABLE} z-50 border min-w-56`}
        >
          {OPCIONES.map(({ href, titulo, detalle, Icono }) => (
            <DropdownMenu.Item key={href} asChild className={OPCION}>
              <Link href={href}>
                <Icono size={20} className="text-primary shrink-0" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="text-sm font-bold">{titulo}</span>
                  <span className="text-xs text-muted-foreground">{detalle}</span>
                </span>
              </Link>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
