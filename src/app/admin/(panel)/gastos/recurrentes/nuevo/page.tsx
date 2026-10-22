import { Repeat } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
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
    <Pantalla titulo="Nuevo recurrente" subtitulo="Un gasto que se carga solo." ayuda="recurrentes">
      <Seccion icono={<Repeat className="text-primary" size={24} />}>
        <FormularioDeRecurrente inicial={inicial} {...opciones} />
      </Seccion>
    </Pantalla>
  );
}
