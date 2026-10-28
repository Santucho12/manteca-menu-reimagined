'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { CampoDeFecha } from '@/components/formularios/CampoDeFecha';
import { OpcionesQueSeTocan } from '@/components/formularios/OpcionesQueSeTocan';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import type { Opcion, OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esquemaFijo, type DatosDeFijo } from '@/lib/gastos/esquemas';
import { opcionesDeFrecuencia } from '@/lib/gastos/pantalla';
import { muestraProveedor } from '@/lib/gastos/proveedor';
import { useGuardar } from '@/lib/gastos/useGuardar';
import { sumarDias } from '@/lib/reportes/periodos';
import { editarFijoDesdeElPanel } from '../acciones-de-configuracion';
import { CamposDelGasto, type PropsDeCampos } from '../CamposDelGasto';

type Props = {
  id: string;
  inicial: DatosDeFijo;
  hoy: string;
  categorias: OpcionDeCategoria[];
  proveedores: Opcion[];
};

/** Corregir un gasto fijo: lo ya cargado no cambia; la fecha y cada cuánto valen desde el próximo pago. */
export function FormularioDeFijo({ id, inicial, hoy, categorias, proveedores }: Props) {
  const router = useRouter();
  const guardado = useGuardar(
    (datos: DatosDeFijo) => editarFijoDesdeElPanel({ ...datos, id }),
    () => router.push('/admin/gastos'),
  );
  const { register, handleSubmit, control, formState } = useForm<DatosDeFijo>({
    resolver: zodResolver(esquemaFijo(hoy)),
    defaultValues: inicial,
  });
  const categoriaId = useWatch({ control, name: 'categoriaId' });
  const conProveedor = muestraProveedor(categorias, categoriaId, inicial);
  const enviar = handleSubmit((datos) =>
    guardado.enviar(conProveedor ? datos : { ...datos, proveedorId: '' }),
  );
  const registro = conValorInicial(register, inicial);
  const { errors } = formState;
  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CamposDelGasto
          registro={registro as unknown as PropsDeCampos['registro']}
          errors={errors}
          inicial={inicial}
          categorias={categorias}
          proveedores={proveedores}
          conProveedor={conProveedor}
        />
        <Controller
          control={control}
          name="proximoPago"
          render={({ field }) => (
            <CampoDeFecha
              id="proximo-pago"
              etiqueta="Próximo pago"
              valor={field.value}
              alCambiar={field.onChange}
              desde={sumarDias(hoy, 1)}
              error={errors.proximoPago?.message}
            />
          )}
        />
      </div>
      <Controller
        control={control}
        name="frecuencia"
        render={({ field }) => (
          <OpcionesQueSeTocan
            nombre="frecuencia"
            etiqueta="¿Cada cuánto?"
            opciones={opcionesDeFrecuencia()}
            valor={field.value}
            alCambiar={field.onChange}
          />
        )}
      />
      <p className="text-xs text-muted-foreground">
        Lo que ya se cargó no cambia. Si cambiás la fecha o cada cuánto, vale desde el próximo pago.
      </p>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/gastos" />
    </form>
  );
}
