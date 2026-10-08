import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { exigirPagina } from '@/lib/acceso/servidor';
import { FormularioDeProveedor } from '../FormularioDeProveedor';

export const metadata: Metadata = { title: 'Nuevo proveedor' };

const VACIO = { nombre: '', telefono: '', ubicacion: '', queCompra: '', observaciones: '' };

export default async function NuevoProveedor() {
  await exigirPagina('admin');
  return (
    <div className="space-y-6">
      <TituloDePagina>Nuevo proveedor</TituloDePagina>
      <FormularioDeProveedor inicial={VACIO} />
    </div>
  );
}
