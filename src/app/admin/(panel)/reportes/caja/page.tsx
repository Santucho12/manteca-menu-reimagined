import type { Metadata } from 'next';
import { PaginasDeReporte } from '@/components/reportes/PaginasDeReporte';
import { Chip } from '@/components/panel/Insignias';
import { COLOR_DE_REPORTE } from '@/lib/reportes/coloresDeGraficos';
import { GraficoDeBarras } from '@/components/reportes/GraficoDeBarras';
import { PantallaDeReporte } from '@/components/reportes/PantallaDeReporte';
import { SinDatos } from '@/components/reportes/SinDatos';
import { Celda, TablaDeDatos } from '@/components/reportes/TablaDeDatos';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { turnosPendientes } from '@/lib/caja/consultasDeTurnos';
import { nombreDelTurno } from '@/lib/caja/turnos';
import { textoDeDiferencia } from '@/lib/caja/pantalla';
import { diasSinAbrir } from '@/lib/caja/sinAbrir';
import { diaEnArgentina } from '@/lib/fechas';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import {
  diferenciasDelGrafico,
  filasDeCaja,
  resumenPorEmpleado,
  type FilaDeCaja,
  type ResumenDeEmpleado,
} from '@/lib/reportes/caja';
import { cierresDelPeriodo } from '@/lib/reportes/consultas';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';

export const metadata: Metadata = { title: 'Caja' };
const RUTA = '/admin/reportes/caja';

const TITULOS_DE_DIA = [
  { texto: 'Día' },
  { texto: 'Empleado' },
  { texto: 'Declarado', der: true },
  { texto: 'Diferencia', der: true },
];

function FilaDelDia({ fila }: { fila: FilaDeCaja }) {
  const { cierre } = fila;
  return (
    <tr>
      <Celda>
        <span className="font-medium whitespace-nowrap">{fechaParaMostrar(fila.fecha)}</span>
        {fila.turno ? (
          <span className="ml-2 text-xs text-muted-foreground">{nombreDelTurno(fila.turno)}</span>
        ) : null}
      </Celda>
      <Celda>
        {cierre ? cierre.persona : <Chip>{fila.noAbrio ? 'No abrió' : 'Sin cierre'}</Chip>}
      </Celda>
      <Celda der>{cierre ? formatearPesos(cierre.declaradoCentavos) : ''}</Celda>
      <Celda der>{cierre ? textoDeDiferencia(cierre.diferenciaCentavos) : ''}</Celda>
    </tr>
  );
}

function CierresPorDia({ filas }: { filas: FilaDeCaja[] }) {
  return (
    <TablaDeDatos etiqueta="Cierres por día" titulos={TITULOS_DE_DIA}>
      {filas.map((fila) => (
        <FilaDelDia key={`${fila.fecha}-${fila.turno ?? 0}`} fila={fila} />
      ))}
    </TablaDeDatos>
  );
}

const TITULOS_DE_EMPLEADO = [
  { texto: 'Empleado' },
  { texto: 'Cierres', der: true },
  { texto: 'Diferencia', der: true },
];

function PorEmpleado({ resumen }: { resumen: ResumenDeEmpleado[] }) {
  return (
    <TablaDeDatos etiqueta="Por empleado" titulos={TITULOS_DE_EMPLEADO}>
      {resumen.map((r) => (
        <tr key={r.persona}>
          <Celda>{r.persona}</Celda>
          <Celda der>{r.cierres}</Celda>
          <Celda der>{textoDeDiferencia(r.diferenciaCentavos)}</Celda>
        </tr>
      ))}
    </TablaDeDatos>
  );
}

function Diferencias({ datos }: { datos: ReturnType<typeof diferenciasDelGrafico> }) {
  if (datos.length === 0) {
    return <p className="text-xs text-muted-foreground">Todavía no hay cierres en este período.</p>;
  }
  // Un renglón por cierre, todos: el gráfico cuenta el período entero, no los diez primeros días.
  return (
    <GraficoDeBarras
      datos={datos}
      etiqueta="Gráfico de la diferencia de cada cierre"
      color={COLOR_DE_REPORTE.caja}
      limite={datos.length}
      altoDeBarra={24}
    />
  );
}

export default async function ReporteDeCaja({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const { desde, hasta } = periodos.actual;
  const { datos } = await exigirPaginaYLeer('admin', (cliente) =>
    Promise.all([
      cierresDelPeriodo(cliente, periodos.actual),
      turnosPendientes(cliente, desde, hasta),
      diasSinAbrir(cliente, desde, hasta),
    ]),
  );
  const [cierres, pendientes, sinAbrir] = datos;
  const filas = filasDeCaja(cierres, pendientes, sinAbrir);
  const pagina = paginaDe(filas, periodos.pagina);
  return (
    <PantallaDeReporte
      titulo="Caja"
      ruta={RUTA}
      periodos={periodos}
      hoy={hoy}
      conComparacion={false}
    >
      {filas.length === 0 ? (
        <SinDatos>No hay cierres en este período.</SinDatos>
      ) : (
        <>
          <Diferencias datos={diferenciasDelGrafico(cierres)} />
          <CierresPorDia filas={pagina.filas} />
          <PaginasDeReporte
            ruta={RUTA}
            periodos={periodos}
            pagina={pagina.pagina}
            paginas={pagina.paginas}
          />
          <h2 className="text-xl font-bold tracking-tight text-slate-800">Por empleado</h2>
          <PorEmpleado resumen={resumenPorEmpleado(cierres)} />
        </>
      )}
    </PantallaDeReporte>
  );
}
