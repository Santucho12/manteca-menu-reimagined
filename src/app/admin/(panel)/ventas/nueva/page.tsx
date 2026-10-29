import { ShoppingBag } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { canalesDeVenta, opcionesParaVender } from '@/lib/ventas/consultas';
import type { DatosDeVenta } from '@/lib/ventas/esquemas';
import { FormularioDeVenta } from './FormularioDeVenta';

export const metadata: Metadata = { title: 'Cargar venta' };

export default async function NuevaVenta() {
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([canalesDeVenta(cliente), opcionesParaVender(cliente)]),
  );
  const [canales, opciones] = datos;
  const activos = canales.filter((canal) => canal.activo);
  const enElLocal = activos.find((canal) => canal.nombre.trim().toLowerCase() === 'en el local');
  const inicial = {
    // Una clave por formulario abierto: guardar dos veces la misma venta no la duplica.
    clave: crypto.randomUUID(),
    fecha: diaEnArgentina(new Date()),
    canalId: enElLocal?.id ?? '',
    // Vacio a proposito: la persona elige como se cobro, el formulario no lo supone.
    medio: '' as DatosDeVenta['medio'],
    comentario: '',
    renglones: [],
  };
  return (
    <Pantalla
      titulo="Cargar venta"
      subtitulo="Para lo que no pasa por Fudo: Cheaf, encargos, ventas a comercios."
      ayuda="ventas"
    >
      <Seccion icono={<ShoppingBag className="text-primary" size={24} />}>
        <FormularioDeVenta inicial={inicial} canales={activos} opciones={opciones} />
      </Seccion>
    </Pantalla>
  );
}
