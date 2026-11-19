import { ShoppingCart } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { compraPorId, formasParaComprar } from '@/lib/compras/consultas';
import { inicialDeLaCompra } from '@/lib/compras/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { proveedoresParaElegir } from '@/lib/materia-prima/consultas';
import { FormularioDeCompra } from '../FormularioDeCompra';

export const metadata: Metadata = { title: 'Cargar compra' };

type Parametros = { searchParams: Promise<{ pedido?: string }> };

export default async function CargarCompra({ searchParams }: Parametros) {
  const { pedido: pedidoId = '' } = await searchParams;
  const { datos } = await exigirPaginaYLeer('admin', (c) =>
    Promise.all([proveedoresParaElegir(c, null), formasParaComprar(c), compraPorId(c, pedidoId)]),
  );
  const [proveedores, formas, compra] = datos;
  const pedido = compra && compra.estado === 'pedida' && !compra.anulado ? compra : null;
  const opciones = [
    { valor: '', texto: 'Elegí el proveedor' },
    ...proveedores.map((p) => ({ valor: p.id, texto: p.nombre })),
  ];
  return (
    <Pantalla
      titulo={pedido ? `Recibir el pedido de ${pedido.proveedor}` : 'Cargar compra'}
      subtitulo="Cargá lo que llegó de verdad y a qué precio, con impuestos."
      ayuda="compras"
    >
      <Seccion icono={<ShoppingCart className="text-primary" size={24} />}>
        <FormularioDeCompra
          inicial={inicialDeLaCompra(diaEnArgentina(new Date()), pedido, formas)}
          proveedores={opciones}
          formas={formas}
        />
      </Seccion>
    </Pantalla>
  );
}
