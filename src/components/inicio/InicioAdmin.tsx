import { BotonDeAyuda } from '@/components/panel/Ayuda';
import { EncabezadoDePantalla } from '@/components/panel/EncabezadoDePantalla';
import { EntradaDePantalla } from '@/components/panel/Entradas';
import { VentasCargadasHasta } from '@/components/panel/VentasCargadasHasta';
import type { datosDelInicio } from '@/lib/inicio/consultas';
import { mesDeHoy } from '@/lib/inicio/meses';
import { numerosDelMes } from '@/lib/inicio/numeros';
import { AYUDAS } from '@/lib/panel/ayudas';
import { totalesDeVentas } from '@/lib/reportes/ventas';
import { Avisos } from './Avisos';
import { BloqueDelMes } from './BloqueDelMes';
import { MasVendidos } from './MasVendidos';
import { MesAMes } from './MesAMes';
import { GastosEnTorta } from './GastosEnTorta';
import { SemanaContraSemana } from './SemanaContraSemana';
import { TarjetasDelMes } from './TarjetasDelMes';

type DatosDelInicio = Awaited<ReturnType<typeof datosDelInicio>>;

/** El tablero del admin: avisos, numeros del mes, bloque de ventas, mes a mes, mas vendidos y semana. */
export function InicioAdmin({ datos, hoy }: { datos: DatosDelInicio; hoy: string }) {
  const cantidad = totalesDeVentas(datos.actual.ventas).ventas;
  return (
    <>
      <EncabezadoDePantalla
        titulo="Inicio"
        subtitulo="Cómo viene el mes y qué hay que saber para comenzar el día."
        ayuda={<BotonDeAyuda ayuda={AYUDAS.inicio} />}
      />
      <EntradaDePantalla className="space-y-8">
        <section aria-label="Este mes" className="space-y-3">
          <VentasCargadasHasta />
          <TarjetasDelMes items={numerosDelMes(datos.actual, datos.anterior)} />
        </section>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 xl:h-[24rem]">
          <div className="xl:col-span-3">
            <BloqueDelMes resultado={datos.actual.resultado} cantidad={cantidad} />
          </div>
          <div className="xl:col-span-2 min-h-0">
            <Avisos avisos={datos.avisos} />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3">
            <MesAMes datos={datos.meses} mesEnCurso={mesDeHoy(hoy)} />
          </div>
          <div className="xl:col-span-2">
            <MasVendidos productos={datos.masVendidos} sinDetalle={datos.sinDetalle} />
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3">
            <SemanaContraSemana datos={datos.semana} />
          </div>
          <div className="xl:col-span-2">
            <GastosEnTorta gastos={datos.actual.gastos} />
          </div>
        </div>
      </EntradaDePantalla>
    </>
  );
}
