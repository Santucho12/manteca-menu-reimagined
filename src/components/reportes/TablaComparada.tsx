import type { ReactNode } from 'react';
import { formatearPesos } from '@/lib/plata';
import { textoDeVariacion, type Variacion } from '@/lib/reportes/comparacion';
import { Celda, TablaDeDatos } from './TablaDeDatos';

export type FilaComparada = {
  clave: string;
  nombre: ReactNode;
  cantidad?: number;
  montoCentavos: number;
  variacion: Variacion;
};
type Props = { titulo: string; filas: FilaComparada[]; tituloDeCantidad?: string };

/** Cada fila con su monto y su variacion contra la misma fila del otro periodo. */
export function TablaComparada({ titulo, filas, tituloDeCantidad }: Props) {
  const titulos = [
    { texto: titulo },
    ...(tituloDeCantidad ? [{ texto: tituloDeCantidad, der: true }] : []),
    { texto: 'Monto', der: true },
    { texto: 'Variación', der: true },
  ];
  return (
    <TablaDeDatos titulos={titulos}>
      {filas.map((f) => (
        <tr key={f.clave}>
          <Celda>{f.nombre}</Celda>
          {tituloDeCantidad ? <Celda der>{f.cantidad}</Celda> : null}
          <Celda der>
            <span className="font-bold whitespace-nowrap">{formatearPesos(f.montoCentavos)}</span>
          </Celda>
          <Celda der>
            <span className="text-muted-foreground">{textoDeVariacion(f.variacion)}</span>
          </Celda>
        </tr>
      ))}
    </TablaDeDatos>
  );
}
