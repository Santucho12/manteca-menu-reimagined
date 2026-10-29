import { Repeat } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotonDeEstado } from '@/components/panel/BotonDeEstado';
import { InsigniaDeEstado } from '@/components/panel/Insignias';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { diaEnArgentina } from '@/lib/fechas';
import { opcionesDeGasto, pagosDelRecurrente, recurrentePorId } from '@/lib/gastos/consultas';
import { datosDeFijoParaEditar } from '@/lib/gastos/esquemas';
import { cambiarEstadoDeRecurrenteDesdeElPanel } from '../../acciones-de-configuracion';
import { FormularioDeFijo } from '../FormularioDeFijo';
import { PagosDelFijo } from '../PagosDelFijo';

export const metadata: Metadata = { title: 'Gasto fijo' };

export default async function FichaDeFijo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cliente, datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([recurrentePorId(cliente, id), opcionesDeGasto(cliente)]),
  );
  const [fijo, opciones] = datos;
  if (!fijo) notFound();
  const hoy = diaEnArgentina(new Date());
  const pagos = await pagosDelRecurrente(cliente, fijo.id);
  return (
    <Pantalla titulo="Gasto fijo" subtitulo="Se carga solo cada vez que toca." ayuda="fijos">
      {fijo.activo ? null : (
        <div>
          <InsigniaDeEstado tono="pizarra">Pausado</InsigniaDeEstado>
        </div>
      )}
      <Seccion icono={<Repeat className="text-primary" size={24} />}>
        <FormularioDeFijo
          id={fijo.id}
          inicial={datosDeFijoParaEditar(fijo, hoy)}
          hoy={hoy}
          {...opciones}
        />
      </Seccion>
      <div className="space-y-2">
        <BotonDeEstado
          id={fijo.id}
          activo={fijo.activo}
          cambiar={cambiarEstadoDeRecurrenteDesdeElPanel}
          apagar="Pausar"
        />
        <p className="text-xs text-muted-foreground">
          Pausado, deja de cargarse. Al reactivarlo, se carga desde ese día.
        </p>
      </div>
      <PagosDelFijo pagos={pagos} />
      <Link
        href="/admin/gastos"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a gastos
      </Link>
    </Pantalla>
  );
}
