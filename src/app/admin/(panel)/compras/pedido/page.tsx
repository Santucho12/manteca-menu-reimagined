import { ClipboardList } from 'lucide-react';
import type { Metadata } from 'next';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { formasParaComprar } from '@/lib/compras/consultas';
import { proveedoresParaElegir } from '@/lib/materia-prima/consultas';
import { FormularioDePedido } from '../OtrosFormularios';

export const metadata: Metadata = { title: 'Armar pedido' };

export default async function ArmarPedido() {
  const { datos } = await exigirPaginaYLeer('admin', (c) =>
    Promise.all([proveedoresParaElegir(c, null), formasParaComprar(c)]),
  );
  const [proveedores, formas] = datos;
  const opciones = [
    { valor: '', texto: 'Elegí el proveedor' },
    ...proveedores.map((p) => ({ valor: p.id, texto: p.nombre })),
  ];
  return (
    <Pantalla
      titulo="Armar pedido"
      subtitulo="Lo que le pedís al proveedor. Al guardarlo lo podés mandar por WhatsApp."
      ayuda="compras"
    >
      <Seccion icono={<ClipboardList className="text-primary" size={24} />}>
        <FormularioDePedido proveedores={opciones} formas={formas} />
      </Seccion>
    </Pantalla>
  );
}
