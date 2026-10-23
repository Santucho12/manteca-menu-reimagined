import {
  BarChart3,
  Banknote,
  CalendarDays,
  Layers,
  PieChart,
  Receipt,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ICONO_DE_TARJETA, TARJETA_DE_SECCION } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { REPORTES } from '@/lib/reportes/lista';

export const metadata: Metadata = { title: 'Reportes' };

const ICONOS: Record<string, LucideIcon> = {
  '/admin/reportes/ventas': TrendingUp,
  '/admin/reportes/productos': BarChart3,
  '/admin/reportes/categorias': Layers,
  '/admin/reportes/gastos': PieChart,
  '/admin/reportes/gastos-por-periodo': CalendarDays,
  '/admin/reportes/caja': Banknote,
  '/admin/reportes/resultado': Receipt,
};

export default async function PaginaDeReportes() {
  await exigirPagina('admin');
  return (
    <Pantalla
      titulo="Reportes"
      subtitulo="Para entender por qué un mes fue mejor o peor."
      ayuda="reportes"
    >
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTES.map((r) => {
          const Icono = ICONOS[r.ruta] ?? BarChart3;
          return (
            <li
              key={r.ruta}
              className={`${TARJETA_DE_SECCION} relative space-y-3 hover:shadow-xl transition-all`}
            >
              <div className={ICONO_DE_TARJETA}>
                <Icono className="text-primary" size={24} aria-hidden="true" />
              </div>
              <Link
                href={r.ruta}
                className="block text-lg font-bold tracking-tight text-slate-800 after:absolute after:inset-0"
              >
                {r.titulo}
              </Link>
              <p className="text-sm text-muted-foreground">{r.pregunta}</p>
            </li>
          );
        })}
      </ul>
    </Pantalla>
  );
}
