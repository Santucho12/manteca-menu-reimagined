import Link from 'next/link';
import { Campo } from '@/components/formularios/Campo';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
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
};

function Atajos({ ruta, hoy }: { ruta: string; hoy: string }) {
  return (
    <nav aria-label="Atajos" className="flex flex-wrap gap-2">
      {atajos(hoy).map((a) => (
        <Button key={a.texto} asChild variant="outline" size="sm">
          <Link href={enlaceDeReporte(ruta, { actual: a.periodo })}>{a.texto}</Link>
        </Button>
      ))}
    </nav>
  );
}

function Comparacion({ periodos }: { periodos: PeriodosDelReporte }) {
  const elegida = periodos.comparacionElegida ? periodos.comparacion : null;
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="text-muted-foreground mb-2 text-sm">
        Comparar con otro período (vacío: el anterior del mismo largo)
      </legend>
      <Campo
        id="cdesde"
        name="cdesde"
        type="date"
        etiqueta="Comparar desde"
        defaultValue={elegida?.desde ?? ''}
      />
      <Campo
        id="chasta"
        name="chasta"
        type="date"
        etiqueta="Comparar hasta"
        defaultValue={elegida?.hasta ?? ''}
      />
    </fieldset>
  );
}

function Filtro({ ruta, periodos, conComparacion }: Omit<Props, 'titulo' | 'hoy'>) {
  return (
    <form action={ruta} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo
          id="desde"
          name="desde"
          type="date"
          etiqueta="Desde"
          defaultValue={periodos.actual.desde}
        />
        <Campo
          id="hasta"
          name="hasta"
          type="date"
          etiqueta="Hasta"
          defaultValue={periodos.actual.hasta}
        />
      </div>
      {conComparacion ? <Comparacion periodos={periodos} /> : null}
      <Button type="submit">Ver</Button>
    </form>
  );
}

/** Titulo, atajos, fechas y comparacion: el mismo encabezado en todos los reportes. */
export function EncabezadoDeReporte({ titulo, ruta, periodos, hoy, conComparacion = true }: Props) {
  const comparado = `, comparado con el período ${textoDePeriodo(periodos.comparacion)}`;
  return (
    <div className="space-y-4">
      <Link
        href="/admin/reportes"
        className="text-muted-foreground text-sm underline-offset-4 hover:underline"
      >
        ← Reportes
      </Link>
      <TituloDePagina>{titulo}</TituloDePagina>
      <Atajos ruta={ruta} hoy={hoy} />
      <Filtro ruta={ruta} periodos={periodos} conComparacion={conComparacion} />
      <p className="text-muted-foreground text-sm">
        Período {textoDePeriodo(periodos.actual)}
        {conComparacion ? comparado : ''}.
      </p>
    </div>
  );
}
