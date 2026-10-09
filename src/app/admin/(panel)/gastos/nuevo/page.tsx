import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { opcionesDeGasto } from '@/lib/gastos/consultas';
import type { DatosDeGasto } from '@/lib/gastos/esquemas';
import { FormularioDeGasto } from '../FormularioDeGasto';

export const metadata: Metadata = { title: 'Cargar gasto' };

export default async function NuevoGasto() {
  const { cliente } = await exigirPagina('admin');
  const opciones = await opcionesDeGasto(cliente);
  const inicial = {
    fecha: diaEnArgentina(new Date()),
    categoriaId: '',
    monto: '',
    descripcion: '',
    proveedorId: '',
    // Vacio a proposito: la persona elige como pago, el formulario no lo supone.
    medioDePago: '' as DatosDeGasto['medioDePago'],
    comprobante: '',
  };
  return (
    <div className="space-y-6">
      <TituloDePagina>Cargar gasto</TituloDePagina>
      <FormularioDeGasto inicial={inicial} {...opciones} />
    </div>
  );
}
