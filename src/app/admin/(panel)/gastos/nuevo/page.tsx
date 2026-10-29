import { Receipt } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { opcionesDeGasto } from '@/lib/gastos/consultas';
import type { DatosDeCarga } from '@/lib/gastos/esquemas';
import { FormularioDeGasto } from '../FormularioDeGasto';

export const metadata: Metadata = { title: 'Cargar gasto' };

export default async function NuevoGasto() {
  const { datos: opciones } = await exigirPaginaYLeer('admin', opcionesDeGasto);
  const hoy = diaEnArgentina(new Date());
  const inicial: DatosDeCarga = {
    fecha: hoy,
    categoriaId: '',
    monto: '',
    descripcion: '',
    proveedorId: '',
    // Vacio a proposito: la persona elige como pago, el formulario no lo supone.
    medioDePago: '' as DatosDeCarga['medioDePago'],
    comprobante: '',
    seRepite: 'no',
    yaPagado: 'si',
    // Una clave por formulario abierto: guardar dos veces el mismo gasto no lo duplica.
    clave: crypto.randomUUID(),
  };
  return (
    <Pantalla
      titulo="Cargar gasto"
      subtitulo="Anotá lo que pagaste. Si se repite, se carga solo."
      ayuda="gastos"
    >
      <Seccion icono={<Receipt className="text-primary" size={24} />}>
        <FormularioDeGasto inicial={inicial} hoy={hoy} {...opciones} />
      </Seccion>
    </Pantalla>
  );
}
