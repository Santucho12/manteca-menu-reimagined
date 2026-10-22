'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import type { Opcion, OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esquemaGasto, type DatosDeGasto } from '@/lib/gastos/esquemas';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { crearGastoDesdeElPanel, editarGastoDesdeElPanel } from './acciones';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { CamposDelGasto, type PropsDeCampos } from './CamposDelGasto';

type Props = {
  inicial: DatosDeGasto;
  id?: string;
  categorias: OpcionDeCategoria[];
  proveedores: Opcion[];
  deCaja?: boolean;
};

export function FormularioDeGasto({ inicial, id, categorias, proveedores, deCaja }: Props) {
  const router = useRouter();
  const guardar = (datos: DatosDeGasto) =>
    id ? editarGastoDesdeElPanel({ ...datos, id }) : crearGastoDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () => router.push('/admin/gastos'));
  const {
    register: registrar,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosDeGasto>({ resolver: zodResolver(esquemaGasto), defaultValues: inicial });
  const registro = conValorInicial(registrar, inicial);
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo
          id="fecha"
          etiqueta="Fecha"
          type="date"
          readOnly={deCaja}
          error={errors.fecha?.message}
          {...registro('fecha')}
        />
        <CamposDelGasto
          registro={registro as unknown as PropsDeCampos['registro']}
          errors={errors}
          inicial={inicial}
          categorias={categorias}
          proveedores={proveedores}
          deCaja={deCaja}
        />
        <Campo
          id="comprobante"
          etiqueta="Comprobante (opcional)"
          error={errors.comprobante?.message}
          {...registro('comprobante')}
        />
      </div>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/gastos" />
    </form>
  );
}
