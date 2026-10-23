'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { Campo } from '@/components/formularios/Campo';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { PieDelFormulario } from '@/components/formularios/PieDelFormulario';
import type { Opcion, OpcionDeCategoria } from '@/lib/gastos/consultas';
import { esquemaRecurrente, type DatosDeRecurrente } from '@/lib/gastos/esquemas';
import { opcionesDeFrecuencia } from '@/lib/gastos/pantalla';
import { useGuardar } from '@/lib/gastos/useGuardar';
import {
  crearRecurrenteDesdeElPanel,
  editarRecurrenteDesdeElPanel,
} from '../acciones-de-configuracion';
import { conValorInicial } from '@/lib/formularios/valorInicial';
import { CamposDelGasto, type PropsDeCampos } from '../CamposDelGasto';

type Props = {
  inicial: DatosDeRecurrente;
  id?: string;
  categorias: OpcionDeCategoria[];
  proveedores: Opcion[];
};

export function FormularioDeRecurrente({ inicial, id, categorias, proveedores }: Props) {
  const router = useRouter();
  const guardar = (datos: DatosDeRecurrente) =>
    id ? editarRecurrenteDesdeElPanel({ ...datos, id }) : crearRecurrenteDesdeElPanel(datos);
  const guardado = useGuardar(guardar, () => router.push('/admin/gastos/recurrentes'));
  const {
    register: registrar,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosDeRecurrente>({
    resolver: zodResolver(esquemaRecurrente),
    defaultValues: inicial,
  });
  const registro = conValorInicial(registrar, inicial);
  return (
    <form onSubmit={handleSubmit(guardado.enviar)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CamposDelGasto
          registro={registro as unknown as PropsDeCampos['registro']}
          errors={errors}
          inicial={inicial}
          categorias={categorias}
          proveedores={proveedores}
        />
        <CampoDeSeleccion
          id="frecuencia"
          etiqueta="Cada cuánto"
          opciones={opcionesDeFrecuencia()}
          error={errors.frecuencia?.message}
          {...registro('frecuencia')}
        />
        <Campo
          id="primer-vencimiento"
          etiqueta="Primer vencimiento"
          type="date"
          error={errors.primerVencimiento?.message}
          {...registro('primerVencimiento')}
        />
      </div>
      {guardado.mensaje ? <AvisoDeError mensaje={guardado.mensaje} /> : null}
      <PieDelFormulario enviando={guardado.enviando} cancelar="/admin/gastos/recurrentes" />
    </form>
  );
}
