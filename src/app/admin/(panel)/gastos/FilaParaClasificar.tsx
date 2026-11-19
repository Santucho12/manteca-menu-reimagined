'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { AvisoDeError } from '@/components/formularios/AvisoDeError';
import { CampoDeSeleccion } from '@/components/formularios/CampoDeSeleccion';
import { ENLACE_EN_TEXTO } from '@/components/panel/Avisos';
import { BOTON_DE_FILA } from '@/components/panel/estilos';
import type {
  FilaParaClasificar as Gasto,
  Opcion,
  OpcionDeCategoria,
} from '@/lib/gastos/consultas';
import { fechaParaMostrar, opcionesParaElegir } from '@/lib/gastos/pantalla';
import { muestraProveedor } from '@/lib/gastos/proveedor';
import { useAccionDelMenu } from '@/lib/menu/useAccionDelMenu';
import { formatearPesos } from '@/lib/plata';
import { clasificarGastoDesdeElPanel } from './acciones';

type Props = { gasto: Gasto; categorias: OpcionDeCategoria[]; proveedores: Opcion[] };

const SIN_NADA = { categoriaId: '', proveedorId: '' };

/** Un gasto de la caja: se le elige la categoría (y el proveedor, si la categoría lo pide) acá. */
export function FilaParaClasificar({ gasto, categorias, proveedores }: Props) {
  const router = useRouter();
  const [categoriaId, setCategoriaId] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const { mensaje, enviando, hacer } = useAccionDelMenu();
  const conProveedor = muestraProveedor(categorias, categoriaId, SIN_NADA);
  const listo = async () => {
    const datos = { id: gasto.id, categoriaId, proveedorId: conProveedor ? proveedorId : '' };
    if (await hacer(() => clasificarGastoDesdeElPanel(datos))) {
      toast.success('Gasto clasificado');
      router.refresh();
    }
  };
  return (
    <li className="px-4 md:px-6 py-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold wrap-break-word">
            {gasto.descripcion ?? 'Sin descripción'}
          </p>
          <p className="text-[11px] text-muted-foreground">{fechaParaMostrar(gasto.fecha)}</p>
        </div>
        <span className="text-sm font-bold tabular-nums">
          {formatearPesos(gasto.monto_centavos)}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <CampoDeSeleccion
          id={`categoria-${gasto.id}`}
          etiqueta="Categoría"
          opciones={opcionesParaElegir(categorias, '', 'Elegí una categoría')}
          value={categoriaId}
          onChange={(evento) => setCategoriaId(evento.target.value)}
        />
        {conProveedor ? (
          <CampoDeSeleccion
            id={`proveedor-${gasto.id}`}
            etiqueta="Proveedor"
            opciones={opcionesParaElegir(proveedores, '', 'Elegí un proveedor')}
            value={proveedorId}
            onChange={(evento) => setProveedorId(evento.target.value)}
          />
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={enviando || categoriaId === ''}
          onClick={listo}
          className={`${BOTON_DE_FILA} h-12 justify-center disabled:opacity-50`}
        >
          Listo
        </button>
      </div>
      <Link
        href={`/admin/compras/desde-gasto/${gasto.id}`}
        className={`text-xs ${ENLACE_EN_TEXTO}`}
      >
        Es una compra
      </Link>
      {mensaje ? <AvisoDeError mensaje={mensaje} /> : null}
    </li>
  );
}
