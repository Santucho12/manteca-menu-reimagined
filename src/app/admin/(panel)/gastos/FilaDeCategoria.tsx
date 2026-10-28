'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { BotonDeEstado } from '@/components/panel/BotonDeEstado';
import { ICONO_EDITAR } from '@/components/panel/estilos';
import { Chip, InsigniaDeEstado } from '@/components/panel/Insignias';
import type { FilaDeCategoria as Categoria } from '@/lib/gastos/consultas';
import { cambiarEstadoDeCategoriaDesdeElPanel } from './acciones-de-configuracion';
import { FormularioDeCategoria } from './FormularioDeCategoria';

function Marcas({ categoria }: { categoria: Categoria }) {
  return (
    <span className="flex flex-wrap gap-1 mt-1">
      {categoria.pide_proveedor ? <Chip>Pide proveedor</Chip> : null}
      {categoria.activo ? null : <InsigniaDeEstado tono="pizarra">Desactivada</InsigniaDeEstado>}
    </span>
  );
}

/** Una categoría en la ventana: se renombra en su renglón, y se desactiva o se reactiva. */
export function FilaDeCategoria({ categoria }: { categoria: Categoria }) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    const inicial = { nombre: categoria.nombre, pideProveedor: categoria.pide_proveedor };
    return (
      <li className="py-3">
        <FormularioDeCategoria
          id={categoria.id}
          inicial={inicial}
          alTerminar={() => setEditando(false)}
        />
      </li>
    );
  }
  return (
    <li className="py-3 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold break-words">{categoria.nombre}</p>
        <Marcas categoria={categoria} />
      </div>
      {categoria.de_sistema ? (
        <span className="text-[11px] text-muted-foreground">Para los gastos de la caja</span>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Editar ${categoria.nombre}`}
            onClick={() => setEditando(true)}
            className={ICONO_EDITAR}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <BotonDeEstado
            id={categoria.id}
            activo={categoria.activo}
            cambiar={cambiarEstadoDeCategoriaDesdeElPanel}
          />
        </div>
      )}
    </li>
  );
}
