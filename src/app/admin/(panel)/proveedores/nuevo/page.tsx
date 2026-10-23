import { Truck } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { FormularioDeProveedor } from '../FormularioDeProveedor';

export const metadata: Metadata = { title: 'Nuevo proveedor' };

const VACIO = { nombre: '', telefono: '', ubicacion: '', queCompra: '', observaciones: '' };

export default async function NuevoProveedor() {
  await exigirPagina('admin');
  return (
    <Pantalla titulo="Nuevo proveedor" subtitulo="Cargá a quién le comprás." ayuda="proveedores">
      <Seccion icono={<Truck className="text-primary" size={24} />}>
        <FormularioDeProveedor inicial={VACIO} />
      </Seccion>
    </Pantalla>
  );
}
