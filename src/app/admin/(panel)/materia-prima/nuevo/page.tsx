import { Wheat } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPagina } from '@/lib/acceso/servidor';
import { FormularioDeInsumo } from '../FormularioDeInsumo';

export const metadata: Metadata = { title: 'Nuevo insumo' };

export default async function NuevoInsumo() {
  await exigirPagina('admin');
  return (
    <Pantalla
      titulo="Nuevo insumo"
      subtitulo="Cargá algo que usás en tus recetas."
      ayuda="materia-prima"
    >
      <Seccion icono={<Wheat className="text-primary" size={24} />}>
        <FormularioDeInsumo inicial={{ nombre: '', unidad: 'g', observaciones: '' }} />
      </Seccion>
    </Pantalla>
  );
}
