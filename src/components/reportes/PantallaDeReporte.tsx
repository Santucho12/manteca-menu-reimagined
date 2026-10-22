import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarraDeFiltros, BotonDeFiltrar, FiltroDeFecha } from '@/components/panel/Filtros';
import { ATAJO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import {
  atajos,
  enlaceDeReporte,
  textoDePeriodo,
  type PeriodosDelReporte,
} from '@/lib/reportes/periodos';

type Props = {
  titulo: string;
  ruta: string;
  periodos: PeriodosDelReporte;
  hoy: string;
  conComparacion?: boolean;
  children: ReactNode;
};

function Atajos({ ruta, hoy }: { ruta: string; hoy: string }) {
  return (
    <nav aria-label="Atajos" className="flex flex-wrap gap-2">
      {atajos(hoy).map((a) => (
        <Link key={a.texto} href={enlaceDeReporte(ruta, { actual: a.periodo })} className={ATAJO}>
          {a.texto}
        </Link>
      ))}
    </nav>
  );
}

function Fechas({ periodos, conComparacion }: Pick<Props, 'periodos' | 'conComparacion'>) {
  const elegida = periodos.comparacionElegida ? periodos.comparacion : null;
  return (
    <>
      <FiltroDeFecha id="desde" name="desde" etiqueta="Desde" valor={periodos.actual.desde} />
      <FiltroDeFecha id="hasta" name="hasta" etiqueta="Hasta" valor={periodos.actual.hasta} />
      {conComparacion ? (
        <>
          <FiltroDeFecha
            id="cdesde"
            name="cdesde"
            etiqueta="Comparar desde"
            valor={elegida?.desde ?? ''}
          />
          <FiltroDeFecha
            id="chasta"
            name="chasta"
            etiqueta="Comparar hasta"
            valor={elegida?.hasta ?? ''}
          />
        </>
      ) : null}
    </>
  );
}

/** Titulo, atajos, fechas y comparacion: el mismo encabezado en todos los reportes. */
export function PantallaDeReporte({
  titulo,
  ruta,
  periodos,
  hoy,
  conComparacion = true,
  children,
}: Props) {
  const comparado = conComparacion
    ? `, comparado con el período ${textoDePeriodo(periodos.comparacion)}`
    : '';
  return (
    <Pantalla
      titulo={titulo}
      subtitulo={`Período ${textoDePeriodo(periodos.actual)}${comparado}.`}
      ayuda="reportes"
    >
      <Atajos ruta={ruta} hoy={hoy} />
      <BarraDeFiltros accion={ruta}>
        <Fechas periodos={periodos} conComparacion={conComparacion} />
        <BotonDeFiltrar texto="Ver" />
      </BarraDeFiltros>
      {children}
      <Link
        href="/admin/reportes"
        className="inline-block text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        Volver a reportes
      </Link>
    </Pantalla>
  );
}
