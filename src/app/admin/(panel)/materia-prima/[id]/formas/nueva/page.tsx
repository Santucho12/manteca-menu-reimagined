import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { insumoPorId, proveedoresParaElegir } from '@/lib/materia-prima/consultas';
import { FormularioDeForma } from '../../../FormularioDeForma';

export const metadata: Metadata = { title: 'Nueva forma de compra' };

const VACIA = { proveedorId: '', comoSeCompra: '', contenido: '', precio: '' };

export default async function NuevaForma({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([insumoPorId(cliente, id), proveedoresParaElegir(cliente, null)]),
  );
  const [insumo, proveedores] = datos;
  if (!insumo) notFound();
  return (
    <Pantalla
      titulo={`Cómo se compra ${insumo.nombre}`}
      subtitulo="A quién se lo comprás, en qué presentación y lo que sale."
      ayuda="materia-prima"
    >
      <Seccion icono={<Package className="text-primary" size={24} />}>
        <FormularioDeForma
          insumo={{ id: insumo.id, unidad: insumo.unidad_de_uso }}
          proveedores={proveedores}
          inicial={VACIA}
        />
      </Seccion>
      <EnlaceDeVolver href={`/admin/materia-prima/${insumo.id}`}>
        {`Volver a ${insumo.nombre}`}
      </EnlaceDeVolver>
    </Pantalla>
  );
}
