import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Etiqueta, Panel } from '@/components/panel/Piezas';
import { GraficoPorMes } from '@/components/reportes/GraficoPorMes';
import { columnasDeAbajo } from '@/lib/inicio/bloqueDelMes';
import type { datosDelInicio } from '@/lib/inicio/consultas';
import { numerosDelMes } from '@/lib/inicio/numeros';
import { totalesDeVentas } from '@/lib/reportes/ventas';
import { Avisos } from './Avisos';
import { BloqueDelMes } from './BloqueDelMes';
import { MasVendidos } from './MasVendidos';
import { TarjetasDelMes } from './TarjetasDelMes';

type DatosDelInicio = Awaited<ReturnType<typeof datosDelInicio>>;

/** Los numeros del mes, el bloque de ventas, lo que hay para atender, el mes a mes y los mas vendidos. */
export function InicioAdmin({ datos }: { datos: DatosDelInicio }) {
  const cantidad = totalesDeVentas(datos.actual.ventas).ventas;
  return (
    <div className="space-y-8">
      <TituloDePagina subtitulo="Cómo viene el mes y lo que hay para atender.">
        Inicio
      </TituloDePagina>
      <section aria-labelledby="este-mes" className="space-y-4">
        <h2 id="este-mes" className="sr-only">
          Este mes
        </h2>
        <p className="sr-only">Del 1 a hoy, contra los mismos días del mes anterior.</p>
        <TarjetasDelMes items={numerosDelMes(datos.actual, datos.anterior)} />
      </section>
      <BloqueDelMes resultado={datos.actual.resultado} cantidad={cantidad} />
      <div className={`grid gap-4 ${columnasDeAbajo(datos.avisos.length > 0)}`}>
        <Avisos avisos={datos.avisos} />
        <Panel
          etiquetadoPor="mes-a-mes"
          className="bg-white"
          etiqueta={
            <Etiqueta as="h2" id="mes-a-mes">
              Mes a mes
            </Etiqueta>
          }
        >
          <div className="p-6">
            <GraficoPorMes datos={datos.meses} />
          </div>
        </Panel>
        <MasVendidos productos={datos.masVendidos} />
      </div>
    </div>
  );
}
