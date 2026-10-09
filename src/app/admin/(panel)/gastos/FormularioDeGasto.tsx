'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { Button } from '@/components/ui/button';
import type { Opcion, OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esquemaGasto, type DatosDeGasto } from '@/lib/gastos/esquemas';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { crearGastoDesdeElPanel, editarGastoDesdeElPanel } from './acciones';
import { CamposDelGasto, type PropsDeCampos } from './CamposDelGasto';

type Props = {
  inicial: DatosDeGasto;
  id?: string;
  categorias: OpcionDeCategoria[];
  proveedores: Opcion[];
};

export function FormularioDeGasto({ inicial, id, categorias, proveedores }: Props) {
  const router = useRouter();
  const guardar = (datos: DatosDeGasto) =>
    id ? editarGastoDesdeElPanel({ ...datos, id }) : crearGastoDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () => router.push('/admin/gastos'));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosDeGasto>({ resolver: zodResolver(esquemaGasto), defaultValues: inicial });
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="max-w-xl space-y-4">
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <Campo
        id="fecha"
        etiqueta="Fecha"
        type="date"
        error={errors.fecha?.message}
        {...register('fecha')}
      />
      <CamposDelGasto
        register={register as unknown as PropsDeCampos['register']}
        errors={errors}
        inicial={inicial}
        categorias={categorias}
        proveedores={proveedores}
      />
      <Campo
        id="comprobante"
        etiqueta="Comprobante (opcional)"
        error={errors.comprobante?.message}
        {...register('comprobante')}
      />
      <Button type="submit" disabled={guardado.enviando}>
        {guardado.enviando ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  );
}
