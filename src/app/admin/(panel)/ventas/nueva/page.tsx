import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { canalesDeVenta, opcionesParaVender } from '@/lib/ventas/consultas';
import type { DatosDeVenta } from '@/lib/ventas/esquemas';
import { FormularioDeVenta } from './FormularioDeVenta';

export const metadata: Metadata = { title: 'Cargar venta' };

export default async function NuevaVenta() {
  const { cliente } = await exigirPagina('admin');
  const [canales, opciones] = await Promise.all([
    canalesDeVenta(cliente),
    opcionesParaVender(cliente),
  ]);
  const inicial = {
    // Una clave por formulario abierto: guardar dos veces la misma venta no la duplica.
    clave: crypto.randomUUID(),
    fecha: diaEnArgentina(new Date()),
    canalId: '',
    // Vacio a proposito: la persona elige como se cobro, el formulario no lo supone.
    medio: '' as DatosDeVenta['medio'],
    comentario: '',
    renglones: [],
  };
  return (
    <div className="space-y-6">
      <TituloDePagina>Cargar venta</TituloDePagina>
      <p className="text-muted-foreground max-w-xl text-sm">
        Para lo que no pasa por Fudo: Cheaf, encargos, ventas a comercios.
      </p>
      <FormularioDeVenta
        inicial={inicial}
        canales={canales.filter((canal) => canal.activo)}
        opciones={opciones}
      />
    </div>
  );
}
