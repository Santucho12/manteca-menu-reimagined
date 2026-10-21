import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { anchoDelBloque } from '@/lib/inicio/bloqueDelMes';
import type { datosDelInicio } from '@/lib/inicio/consultas';
import { numerosDelMes } from '@/lib/inicio/numeros';
import { totalesDeVentas } from '@/lib/reportes/ventas';
import { Avisos } from './Avisos';
import { BloqueDelMes } from './BloqueDelMes';
import { MasVendidos } from './MasVendidos';
import { MesAMes } from './MesAMes';
import { TarjetasDelMes } from './TarjetasDelMes';

type DatosDelInicio = Awaited<ReturnType<typeof datosDelInicio>>;

/** Los numeros del mes, el bloque de ventas, lo que hay para atender, el mes a mes y los mas vendidos. */
export function InicioAdmin({ datos }: { datos: DatosDelInicio }) {
  const cantidad = totalesDeVentas(datos.actual.ventas).ventas;
  return (
    <div className="space-y-6">
      <TituloDePagina subtitulo="Cómo viene el mes y lo que hay para atender.">
        Inicio
      </TituloDePagina>
      <section aria-labelledby="este-mes">
        <h2 id="este-mes" className="sr-only">
          Este mes
        </h2>
        <TarjetasDelMes items={numerosDelMes(datos.actual, datos.anterior)} />
      </section>
      <div className="grid gap-6 lg:grid-cols-12">
        <BloqueDelMes
          resultado={datos.actual.resultado}
          cantidad={cantidad}
          className={anchoDelBloque(datos.avisos.length > 0)}
        />
        <Avisos avisos={datos.avisos} className="lg:col-span-4" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <MesAMes datos={datos.meses} className="lg:col-span-7" />
        <MasVendidos productos={datos.masVendidos} className="lg:col-span-5" />
      </div>
    </div>
  );
}
