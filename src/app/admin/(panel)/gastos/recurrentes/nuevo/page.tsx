import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { opcionesDeGasto } from '@/lib/gastos/consultas';
import type { DatosDeRecurrente } from '@/lib/gastos/esquemas';
import { FormularioDeRecurrente } from '../FormularioDeRecurrente';

export const metadata: Metadata = { title: 'Nuevo recurrente' };

export default async function NuevoRecurrente() {
  const { cliente } = await exigirPagina('admin');
  const opciones = await opcionesDeGasto(cliente);
  const inicial = {
    categoriaId: '',
    monto: '',
    descripcion: '',
    proveedorId: '',
    medioDePago: '' as DatosDeRecurrente['medioDePago'],
    frecuencia: 'mensual' as const,
    primerVencimiento: diaEnArgentina(new Date()),
  };
  return (
    <div className="space-y-6">
      <TituloDePagina>Nuevo recurrente</TituloDePagina>
      <FormularioDeRecurrente inicial={inicial} {...opciones} />
    </div>
  );
}
