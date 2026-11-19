import { Package } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { insumoPorId, proveedoresParaElegir } from '@/lib/materia-prima/consultas';
import { datosDeFormaParaEditar } from '@/lib/materia-prima/esquemas';
import { EstadoDeLaForma } from '../../../BotonesDeEstado';
import { FormularioDeForma } from '../../../FormularioDeForma';

export const metadata: Metadata = { title: 'Editar forma de compra' };

type Parametros = { params: Promise<{ id: string; forma: string }> };

export default async function EditarForma({ params }: Parametros) {
  const { id, forma: formaId } = await params;
  const { datos: insumo, cliente } = await exigirPaginaYLeer('admin', (c) => insumoPorId(c, id));
  const forma = insumo?.formas.find((f) => f.id === formaId);
  if (!insumo || !forma) notFound();
  const proveedores = await proveedoresParaElegir(cliente, forma.proveedor_id);
  return (
    <Pantalla
      titulo={`Editar ${forma.como_se_compra}`}
      subtitulo={`Cómo se compra ${insumo.nombre}.`}
      ayuda="materia-prima"
    >
      {forma.activo ? null : (
        <div>
          <InsigniaDeEstado tono="pizarra">Desactivada</InsigniaDeEstado>
        </div>
      )}
      <Seccion icono={<Package className="text-primary" size={24} />}>
        <FormularioDeForma
          insumo={{ id: insumo.id, unidad: insumo.unidad_de_uso }}
          proveedores={proveedores}
          inicial={datosDeFormaParaEditar(forma)}
          id={forma.id}
        />
      </Seccion>
      <EstadoDeLaForma id={forma.id} activo={forma.activo} />
      <EnlaceDeVolver href={`/admin/materia-prima/${insumo.id}`}>
        {`Volver a ${insumo.nombre}`}
      </EnlaceDeVolver>
    </Pantalla>
  );
}
