import { enlaceDeGastos, type FiltrosDeGastos } from '@/lib/gastos/pantalla';
import type { ResumenDeCategoria } from '@/lib/gastos/porCategoria';
import { TarjetaDeCategoria } from './TarjetaDeCategoria';

type Props = { resumen: ResumenDeCategoria[]; filtros: FiltrosDeGastos; hoy: string };

/** Una tarjeta por categoria con gastos en el mes; cada una abre una ventana con sus gastos. */
export function TarjetasDeCategoria({ resumen, filtros, hoy }: Props) {
  if (resumen.length === 0) return null;
  return (
    <ul
      aria-label="Categorías del mes"
      className="grid grid-cols-2 items-start gap-3 md:grid-cols-3"
    >
      {resumen.map((categoria) => {
        const activa = filtros.categoriaId === categoria.categoriaId;
        const destino = {
          ...filtros,
          categoriaId: activa ? null : categoria.categoriaId,
          pagina: 1,
        };
        return (
          <li key={categoria.categoriaId}>
            <TarjetaDeCategoria
              categoria={categoria}
              enlace={enlaceDeGastos(destino, hoy)}
              activa={activa}
            />
          </li>
        );
      })}
    </ul>
  );
}
