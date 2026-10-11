import type { Metadata } from 'next';
import { EncabezadoDeReporte } from '@/components/reportes/EncabezadoDeReporte';
import { GraficoDeBarras } from '@/components/reportes/GraficoDeBarras';
import { Paginas } from '@/components/reportes/Paginas';
import { SinDatos } from '@/components/reportes/SinDatos';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { exigirPagina } from '@/lib/acceso/servidor';
import { primerDiaConCierre } from '@/lib/caja/consultas';
import { diaEnArgentina } from '@/lib/fechas';
import { fechaParaMostrar } from '@/lib/gastos/pantalla';
import { formatearPesos } from '@/lib/plata';
import {
  diferenciasDelGrafico,
  filasDeCaja,
  resumenPorEmpleado,
  textoDeDiferencia,
  type FilaDeCaja,
  type ResumenDeEmpleado,
} from '@/lib/reportes/caja';
import { cierresDelPeriodo } from '@/lib/reportes/consultas';
import { paginaDe } from '@/lib/reportes/paginas';
import { periodosDelReporte, type ParametrosDeReporte } from '@/lib/reportes/periodos';

export const metadata: Metadata = { title: 'Caja' };
const RUTA = '/admin/reportes/caja';

function FilaDelDia({ fila }: { fila: FilaDeCaja }) {
  const { cierre } = fila;
  return (
    <TableRow>
      <TableCell>{fechaParaMostrar(fila.fecha)}</TableCell>
      <TableCell>{cierre ? cierre.persona : <Badge variant="outline">Sin cierre</Badge>}</TableCell>
      <TableCell className="text-right">
        {cierre ? formatearPesos(cierre.declaradoCentavos) : ''}
      </TableCell>
      <TableCell className="text-right">
        {cierre ? textoDeDiferencia(cierre.diferenciaCentavos) : ''}
      </TableCell>
    </TableRow>
  );
}

function CierresPorDia({ filas }: { filas: FilaDeCaja[] }) {
  return (
    <Table aria-label="Cierres por día">
      <TableHeader>
        <TableRow>
          <TableHead>Día</TableHead>
          <TableHead>Empleado</TableHead>
          <TableHead className="text-right">Declarado</TableHead>
          <TableHead className="text-right">Diferencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((fila) => (
          <FilaDelDia key={fila.fecha} fila={fila} />
        ))}
      </TableBody>
    </Table>
  );
}

function PorEmpleado({ resumen }: { resumen: ResumenDeEmpleado[] }) {
  return (
    <Table aria-label="Por empleado">
      <TableHeader>
        <TableRow>
          <TableHead>Empleado</TableHead>
          <TableHead className="text-right">Cierres</TableHead>
          <TableHead className="text-right">Diferencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resumen.map((r) => (
          <TableRow key={r.persona}>
            <TableCell>{r.persona}</TableCell>
            <TableCell className="text-right">{r.cierres}</TableCell>
            <TableCell className="text-right">{textoDeDiferencia(r.diferenciaCentavos)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Diferencias({ datos }: { datos: ReturnType<typeof diferenciasDelGrafico> }) {
  if (datos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavía no hay diferencias: los cierres esperan las ventas de Fudo.
      </p>
    );
  }
  return <GraficoDeBarras datos={datos} />;
}

export default async function ReporteDeCaja({
  searchParams,
}: {
  searchParams: Promise<ParametrosDeReporte>;
}) {
  const { cliente } = await exigirPagina('admin');
  const hoy = diaEnArgentina(new Date());
  const periodos = periodosDelReporte(await searchParams, hoy);
  const [cierres, primero] = await Promise.all([
    cierresDelPeriodo(cliente, periodos.actual),
    primerDiaConCierre(cliente),
  ]);
  const filas = filasDeCaja(cierres, periodos.actual, primero, hoy);
  const pagina = paginaDe(filas, periodos.pagina);
  return (
    <div className="space-y-6">
      <EncabezadoDeReporte
        titulo="Caja"
        ruta={RUTA}
        periodos={periodos}
        hoy={hoy}
        conComparacion={false}
      />
      {filas.length === 0 ? (
        <SinDatos>No hay cierres en este período.</SinDatos>
      ) : (
        <>
          <Diferencias datos={diferenciasDelGrafico(cierres)} />
          <CierresPorDia filas={pagina.filas} />
          <Paginas
            ruta={RUTA}
            periodos={periodos}
            pagina={pagina.pagina}
            paginas={pagina.paginas}
          />
          <h2 className="font-heading text-xl font-semibold">Por empleado</h2>
          <PorEmpleado resumen={resumenPorEmpleado(cierres)} />
        </>
      )}
    </div>
  );
}
