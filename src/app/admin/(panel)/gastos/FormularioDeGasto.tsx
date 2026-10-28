'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import type { Opcion, OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esquemaCarga, type DatosDeCarga } from '@/lib/gastos/esquemas';
import { muestraProveedor } from '@/lib/gastos/proveedor';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { cargarGastoDesdeElPanel, editarGastoDesdeElPanel } from './acciones';
import { CamposDelGasto, type PropsDeCampos } from './CamposDelGasto';
import { FechaYRepeticion } from './FechaYRepeticion';

type Props = {
  inicial: DatosDeCarga;
  id?: string;
  categorias: OpcionDeCategoria[];
  proveedores: Opcion[];
  deCaja?: boolean;
  hoy: string;
};

/** Cargar (sin id) un gasto suelto o fijo, o corregir (con id) un gasto ya cargado. */
export function FormularioDeGasto({ inicial, id, categorias, proveedores, ...resto }: Props) {
  const { deCaja = false, hoy } = resto;
  const router = useRouter();
  const guardar = (datos: DatosDeCarga) =>
    id ? editarGastoDesdeElPanel({ ...datos, id }) : cargarGastoDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () => router.push('/admin/gastos'));
  const { register, handleSubmit, control, formState } = useForm<DatosDeCarga>({
    resolver: zodResolver(esquemaCarga(hoy)),
    defaultValues: inicial,
  });
  const [categoriaId, seRepite] = useWatch({ control, name: ['categoriaId', 'seRepite'] });
  const conProveedor = muestraProveedor(categorias, categoriaId, inicial);
  // Sin el campo a la vista, el gasto se guarda sin proveedor.
  const enviar = handleSubmit((datos) =>
    guardado.enviar(conProveedor ? datos : { ...datos, proveedorId: '' }),
  );
  const registro = conValorInicial(register, inicial);
  const { errors } = formState;
  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <FechaYRepeticion control={control} errors={errors} hoy={hoy} nuevo={!id} deCaja={deCaja} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CamposDelGasto
          registro={registro as unknown as PropsDeCampos['registro']}
          errors={errors}
          inicial={inicial}
          categorias={categorias}
          proveedores={proveedores}
          conProveedor={conProveedor}
          deCaja={deCaja}
        />
        {seRepite === 'no' ? (
          <Campo
            id="comprobante"
            etiqueta="Comprobante (opcional)"
            error={errors.comprobante?.message}
            {...registro('comprobante')}
          />
        ) : null}
      </div>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/gastos" />
    </form>
  );
}
