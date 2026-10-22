import { Receipt } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
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
    // Una clave por formulario abierto: guardar dos veces el mismo gasto no lo duplica.
    clave: crypto.randomUUID(),
  };
  return (
    <Pantalla titulo="Cargar gasto" subtitulo="Anotá lo que pagaste." ayuda="gastos">
      <Seccion icono={<Receipt className="text-primary" size={24} />}>
        <FormularioDeGasto inicial={inicial} {...opciones} />
      </Seccion>
    </Pantalla>
  );
}
