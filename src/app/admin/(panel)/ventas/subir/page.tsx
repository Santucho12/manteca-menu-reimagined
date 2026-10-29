import { FileSpreadsheet } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { FormularioDeExcel } from './FormularioDeExcel';
import { PasosDeLaSubida } from './PasosDeLaSubida';

export const metadata: Metadata = { title: 'Subir Excel de Fudo' };

export default async function SubirExcelDeFudo() {
  await exigirPagina('admin');
  return (
    <Pantalla
      titulo="Subir Excel de Fudo"
      subtitulo="Las ventas de Fudo, desde el reporte de ventas que baja de su panel."
      ayuda="ventas"
    >
      <PasosDeLaSubida />
      <Seccion icono={<FileSpreadsheet className="text-emerald-600" size={24} />}>
        <FormularioDeExcel />
      </Seccion>
    </Pantalla>
  );
}
