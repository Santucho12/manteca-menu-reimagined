import { Pencil, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CargadoPor } from '@/components/panel/CargadoPor';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Dato, Datos, Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { insumoPorId, type Insumo } from '@/lib/materia-prima/consultas';
import { costoParaMostrar, textoDelOrigen } from '@/lib/materia-prima/costo';
import { textoDeUnidad } from '@/lib/materia-prima/pantalla';
import { EstadoDelInsumo } from '../BotonesDeEstado';
import { FormasDeCompra } from './FormasDeCompra';

export const metadata: Metadata = { title: 'Insumo' };

function DatosDelInsumo({ insumo }: { insumo: Insumo }) {
  const costo = costoParaMostrar(insumo.costo_por_unidad, insumo.unidad_de_uso);
  return (
    <Seccion forma="lista">
      <Datos>
        <Dato titulo="En qué se mide" valor={textoDeUnidad(insumo.unidad_de_uso)} />
        <Dato titulo="Costo hoy" valor={costo ?? 'Sin precio'} />
        <Dato titulo="De dónde sale" valor={textoDelOrigen(insumo.origen, insumo.fecha_origen)} />
        <Dato titulo="Observaciones" valor={insumo.observaciones} />
      </Datos>
    </Seccion>
  );
}

const Acciones = ({ id }: { id: string }) => (
  <>
    <Link href={`/admin/materia-prima/${id}/formas/nueva`} className={BOTON_DE_ENCABEZADO}>
      <Plus size={18} aria-hidden="true" /> Agregar forma de compra
    </Link>
    <Link href={`/admin/materia-prima/${id}/editar`} className={BOTON_DE_ENCABEZADO_NEUTRO}>
      <Pencil size={18} aria-hidden="true" /> Editar
    </Link>
  </>
);

export default async function FichaDeInsumo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cliente, datos: insumo } = await exigirPaginaYLeer('admin', (c) => insumoPorId(c, id));
  if (!insumo) notFound();
  return (
    <Pantalla
      titulo={insumo.nombre}
      subtitulo="Lo que cuesta hoy y cómo se compra."
      acciones={<Acciones id={insumo.id} />}
      ayuda="materia-prima"
    >
      {insumo.activo ? null : (
        <div>
          <InsigniaDeEstado tono="pizarra">Desactivado</InsigniaDeEstado>
        </div>
      )}
      <CargadoPor cliente={cliente} tabla="insumos" id={insumo.id} />
      <DatosDelInsumo insumo={insumo} />
      <FormasDeCompra insumo={insumo} />
      <EstadoDelInsumo id={insumo.id} activo={insumo.activo} />
      <EnlaceDeVolver href="/admin/materia-prima">Volver a materia prima</EnlaceDeVolver>
    </Pantalla>
  );
}
