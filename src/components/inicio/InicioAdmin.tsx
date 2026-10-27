import { BotonDeAyuda } from '@/components/panel/Ayuda';
import { EncabezadoDePantalla } from '@/components/panel/EncabezadoDePantalla';
import { EntradaDePantalla } from '@/components/panel/Entradas';
import type { datosDelInicio } from '@/lib/inicio/consultas';
import { numerosDelMes } from '@/lib/inicio/numeros';
import { AYUDAS } from '@/lib/panel/ayudas';
import { totalesDeVentas } from '@/lib/reportes/ventas';
import { Avisos } from './Avisos';
import { BloqueDelMes } from './BloqueDelMes';
import { MasVendidos } from './MasVendidos';
import { MesAMes } from './MesAMes';
import { SemanaContraSemana } from './SemanaContraSemana';
import { TarjetasDelMes } from './TarjetasDelMes';

type DatosDelInicio = Awaited<ReturnType<typeof datosDelInicio>>;

/** El tablero del admin: avisos, numeros del mes, bloque de ventas, mes a mes, mas vendidos y semana. */
export function InicioAdmin({ datos }: { datos: DatosDelInicio }) {
  const cantidad = totalesDeVentas(datos.actual.ventas).ventas;
  return (
    <>
      <EncabezadoDePantalla
        titulo="Inicio"
        subtitulo="Cómo viene el mes y qué hay que atender."
        ayuda={<BotonDeAyuda ayuda={AYUDAS.inicio} />}
      />
      <EntradaDePantalla className="space-y-4">
        <section aria-label="Este mes">
          <TarjetasDelMes items={numerosDelMes(datos.actual, datos.anterior)} />
        </section>
        <BloqueDelMes resultado={datos.actual.resultado} cantidad={cantidad} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <MesAMes datos={datos.meses} />
          </div>
          <Avisos avisos={datos.avisos} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <SemanaContraSemana datos={datos.semana} />
          </div>
          <MasVendidos productos={datos.masVendidos} />
        </div>
      </EntradaDePantalla>
    </>
  );
}
