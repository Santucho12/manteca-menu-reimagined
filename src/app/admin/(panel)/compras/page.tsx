import { ClipboardList, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BOTON_DE_ENCABEZADO, BOTON_DE_ENCABEZADO_NEUTRO } from '@/components/panel/estilos';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { SinResultados } from '@/components/panel/SinResultados';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { listarCompras, type FilaDeCompra } from '@/lib/compras/consultas';
import {
  estadoDeCompra,
  filtrosDeCompras,
  pagoDeCompra,
  type ParametrosDeCompras,
} from '@/lib/compras/pantalla';
import { diaEnArgentina } from '@/lib/fechas';
import { proveedoresParaElegir } from '@/lib/materia-prima/consultas';
import { FiltrosDeCompras } from './FiltrosDeCompras';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';

export const metadata: Metadata = { title: 'Compras' };

const TONOS = { Pedida: 'ambar', Recibida: 'esmeralda', Anulada: 'pizarra' } as const;

function Compra({ fila }: { fila: FilaDeCompra }) {
  const estado = estadoDeCompra(fila);
  const cuando = fila.fecha ? fechaParaMostrar(fila.fecha) : 'Sin recibir';
  return (
    <li className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/admin/compras/${fila.id}`}
          className="text-sm font-bold wrap-break-word hover:text-primary"
        >
          {fila.proveedor} · {cuando}
        </Link>
        <p className="text-xs text-muted-foreground">
          {fila.renglones} {fila.renglones === 1 ? 'renglón' : 'renglones'} ·{' '}
          {pagoDeCompra({ gasto: fila.pagada, vencimiento: fila.vencimiento })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <InsigniaDeEstado tono={TONOS[estado]}>{estado}</InsigniaDeEstado>
        <span className="text-sm font-bold whitespace-nowrap">
          {formatearPesos(fila.total_centavos)}
        </span>
      </div>
    </li>
  );
}

const Acciones = () => (
  <>
    <Link href="/admin/compras/nueva" className={BOTON_DE_ENCABEZADO}>
      <Plus size={18} aria-hidden="true" /> Cargar compra
    </Link>
    <Link href="/admin/compras/pedido" className={BOTON_DE_ENCABEZADO_NEUTRO}>
      <ClipboardList size={18} aria-hidden="true" /> Armar pedido
    </Link>
  </>
);

export default async function PaginaDeCompras({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeCompras>;
}) {
  const filtros = filtrosDeCompras(await searchParams, diaEnArgentina(new Date()));
  const { datos } = await exigirPaginaYLeer('admin', (c) =>
    Promise.all([listarCompras(c, filtros), proveedoresParaElegir(c, filtros.proveedor)]),
  );
  const [filas, proveedores] = datos;
  return (
    <Pantalla
      titulo="Compras"
      subtitulo="La mercadería que entra, con lo que llegó y a qué precio."
      acciones={<Acciones />}
      ayuda="compras"
    >
      <FiltrosDeCompras filtros={filtros} proveedores={proveedores} />
      {filas.length === 0 ? (
        <SinResultados
          titulo="No hay compras en este período"
          texto="Cambiá el período o el proveedor, o cargá una con Cargar compra."
        />
      ) : (
        <ul aria-label="Compras" className="space-y-3">
          {filas.map((fila) => (
            <Compra key={fila.id} fila={fila} />
          ))}
        </ul>
      )}
    </Pantalla>
  );
}
