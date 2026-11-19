'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { useUnaVez } from '@/lib/formularios/useUnaVez';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import type { ProveedorParaElegir } from '@/lib/materia-prima/consultas';
import type { UnidadDeUso } from '@/lib/materia-prima/costo';
import { esquemaFormaDeCompra, type DatosDeFormaDeCompra } from '@/lib/materia-prima/esquemas';
import { etiquetaDelContenido } from '@/lib/materia-prima/pantalla';
import { crearFormaDesdeElPanel, editarFormaDesdeElPanel } from './acciones';

type Props = {
  insumo: { id: string; unidad: UnidadDeUso };
  proveedores: ProveedorParaElegir[];
  inicial: DatosDeFormaDeCompra;
  id?: string;
};

const opcionesDe = (proveedores: ProveedorParaElegir[]) => [
  { valor: '', texto: 'Sin proveedor' },
  ...proveedores.map((p) => ({ valor: p.id, texto: p.nombre })),
];

/** Como se compra un insumo: a quien, en que presentacion, cuanto trae y lo que sale. */
export function FormularioDeForma({ insumo, proveedores, inicial, id }: Props) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const { enviando, unaVez } = useUnaVez();
  const { register, handleSubmit, formState } = useForm<DatosDeFormaDeCompra>({
    resolver: zodResolver(esquemaFormaDeCompra),
    defaultValues: inicial,
  });
  const errors = formState.errors;
  const registro = conValorInicial(register, inicial);
  const enviar = (datos: DatosDeFormaDeCompra) =>
    unaVez(async () => {
      const resultado = id
        ? await editarFormaDesdeElPanel({ ...datos, id })
        : await crearFormaDesdeElPanel({ ...datos, insumoId: insumo.id });
      setMensaje(resultado.ok ? null : resultado.mensaje);
      if (resultado.ok) router.push(`/admin/materia-prima/${insumo.id}`);
    });
  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampoDeSeleccion
          id="proveedor"
          etiqueta="Proveedor"
          opciones={opcionesDe(proveedores)}
          error={errors.proveedorId?.message}
          {...registro('proveedorId')}
        />
        <Campo
          id="como-se-compra"
          etiqueta="Cómo se compra"
          placeholder="Bolsa de 25 kg"
          error={errors.comoSeCompra?.message}
          {...registro('comoSeCompra')}
        />
        <Campo
          id="contenido"
          etiqueta={etiquetaDelContenido(insumo.unidad)}
          inputMode="decimal"
          error={errors.contenido?.message}
          {...registro('contenido')}
        />
        <Campo
          id="precio"
          etiqueta="Precio de referencia"
          inputMode="decimal"
          error={errors.precio?.message}
          {...registro('precio')}
        />
      </div>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
      <PieDelFormulario enviando={enviando} cancelar={`/admin/materia-prima/${insumo.id}`} />
    </form>
  );
}
