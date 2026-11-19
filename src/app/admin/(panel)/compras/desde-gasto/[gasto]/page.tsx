import { ShoppingCart } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { formasParaComprar, gastoParaCompra } from '@/lib/compras/consultas';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { proveedoresParaElegir } from '@/lib/materia-prima/consultas';
import { formatearPesos } from '@/lib/plata';
import { FormularioDesdeGasto } from '../../OtrosFormularios';

export const metadata: Metadata = { title: 'Es una compra' };

export default async function EsUnaCompra({ params }: { params: Promise<{ gasto: string }> }) {
  const { gasto: gastoId } = await params;
  const { datos } = await exigirPaginaYLeer('admin', (c) =>
    Promise.all([
      gastoParaCompra(c, gastoId),
      proveedoresParaElegir(c, null),
      formasParaComprar(c),
    ]),
  );
  const [gasto, proveedores, formas] = datos;
  if (!gasto) notFound();
  const opciones = [
    { valor: '', texto: 'Elegí el proveedor' },
    ...proveedores.map((p) => ({ valor: p.id, texto: p.nombre })),
  ];
  return (
    <Pantalla
      titulo="Es una compra"
      subtitulo={`${gasto.descripcion ?? 'Gasto de la caja'} · ${fechaParaMostrar(gasto.fecha)} · ${formatearPesos(gasto.montoCentavos)}`}
      ayuda="compras"
    >
      <p className="text-sm text-muted-foreground">
        Cargá lo que se compró con la caja. Si los renglones no llegan al monto, la diferencia va a
        otros cargos.
      </p>
      <Seccion icono={<ShoppingCart className="text-primary" size={24} />}>
        <FormularioDesdeGasto gastoId={gasto.id} proveedores={opciones} formas={formas} />
      </Seccion>
      <EnlaceDeVolver href="/admin/gastos">Volver a gastos</EnlaceDeVolver>
    </Pantalla>
  );
}
