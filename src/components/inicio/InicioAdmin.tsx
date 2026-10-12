import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { GraficoPorMes } from '@/components/reportes/GraficoPorMes';
import { Totales } from '@/components/reportes/Totales';
import type { datosDelInicio } from '@/lib/inicio/consultas';
import { numerosDelMes } from '@/lib/inicio/numeros';
import { Avisos } from './Avisos';
import { MasVendidos } from './MasVendidos';

type DatosDelInicio = Awaited<ReturnType<typeof datosDelInicio>>;

function Bloque({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <h2 id={id} className="font-heading text-xl font-semibold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Lo que requiere accion, los numeros del mes, el mes a mes y los mas vendidos. */
export function InicioAdmin({ datos }: { datos: DatosDelInicio }) {
  return (
    <div className="space-y-8">
      <TituloDePagina subtitulo="Cómo viene el mes y lo que hay para atender.">
        Inicio
      </TituloDePagina>
      <Avisos avisos={datos.avisos} />
      <Bloque id="este-mes" titulo="Este mes">
        <p className="text-muted-foreground text-sm">
          Del 1 a hoy, contra los mismos días del mes anterior.
        </p>
        <Totales items={numerosDelMes(datos.actual, datos.anterior)} grilla="cuatro" />
      </Bloque>
      <Bloque id="mes-a-mes" titulo="Mes a mes">
        <GraficoPorMes datos={datos.meses} />
      </Bloque>
      <MasVendidos productos={datos.masVendidos} />
    </div>
  );
}
