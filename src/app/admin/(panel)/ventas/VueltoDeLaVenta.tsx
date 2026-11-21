'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PorArmar } from '@/lib/vender/consultas';
import { ArmarFacturas } from '../vender/ArmarFacturas';
import { VentanaDeVuelto } from '../vender/VentanaDeVuelto';

type Props = {
  efectivoCentavos: number | null;
  /** Las surtidas de la venta recién cobrada, con las facturas para elegir (pedido 102). */
  pendientes?: PorArmar[];
  productos?: Record<string, { id: string; nombre: string }[]>;
};

/** La ventana que trae Vender al cobrar: el vuelto y, si hay surtidas, armarlas. */
export function VueltoDeLaVenta({ efectivoCentavos, pendientes = [], productos = {} }: Props) {
  const router = useRouter();
  const ruta = usePathname();
  const [armadas, setArmadas] = useState(0);
  const pendiente = pendientes[armadas];
  if (!efectivoCentavos && !pendiente) return null;
  const cerrar = () => router.replace(ruta, { scroll: false });
  const siguiente = () => (armadas + 1 < pendientes.length ? setArmadas(armadas + 1) : cerrar());
  return (
    <VentanaDeVuelto
      efectivoCentavos={efectivoCentavos}
      cerrar={cerrar}
      esperar={!!pendiente}
      armar={
        pendiente ? (
          <ArmarFacturas
            key={pendiente.renglonId}
            pendiente={pendiente}
            productos={productos[pendiente.categoriaId] ?? []}
            alTerminar={() => setTimeout(siguiente, 900)}
            despues={cerrar}
          />
        ) : null
      }
    />
  );
}
