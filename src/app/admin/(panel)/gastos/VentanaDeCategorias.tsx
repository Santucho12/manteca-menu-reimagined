'use client';

import { Tags } from 'lucide-react';
import { useState } from 'react';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { Ventana } from '@/components/panel/Ventana';
import type { FilaDeCategoria as Categoria } from '@/lib/gastos/consultas';
import { FilaDeCategoria } from './FilaDeCategoria';
import { FormularioDeCategoria } from './FormularioDeCategoria';

/** El botón "Categorías" del encabezado y su ventana: sumar, renombrar y desactivar ahí mismo. */
export function VentanaDeCategorias({ categorias }: { categorias: Categoria[] }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} className={ACCESO_SECUNDARIO}>
        <span className={ICONO_DE_ACCESO_SUAVE}>
          <Tags size={15} aria-hidden="true" />
        </span>
        Categorías
      </button>
      <Ventana
        abierta={abierta}
        cerrar={() => setAbierta(false)}
        titulo="Categorías de gastos"
        ancho="max-w-lg"
      >
        <ul aria-label="Categorías" className="divide-y divide-border border-y border-border">
          {categorias.map((categoria) => (
            <FilaDeCategoria key={categoria.id} categoria={categoria} />
          ))}
        </ul>
        <section className="space-y-3">
          <h3 className="text-sm font-bold">Sumar una categoría</h3>
          <FormularioDeCategoria />
        </section>
      </Ventana>
    </>
  );
}
