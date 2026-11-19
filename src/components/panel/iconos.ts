import {
  BookOpen,
  Calculator,
  ChartColumn,
  History,
  LayoutDashboard,
  ListChecks,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import type { EnlaceDelPanel } from '@/lib/acceso/estados';

// Plan Reminder Pro no tiene estas secciones: los eligio Claude (skill estetica-panel).
export const ICONOS_DEL_PANEL: Record<EnlaceDelPanel['clave'], LucideIcon> = {
  inicio: LayoutDashboard,
  vender: Store,
  menu: BookOpen,
  ventas: ShoppingBag,
  proveedores: Truck,
  'materia-prima': Wheat,
  compras: ShoppingCart,
  costos: Calculator,
  gastos: Receipt,
  caja: Wallet,
  reportes: ChartColumn,
  cierres: ListChecks,
  usuarios: Users,
  auditoria: History,
  cuenta: UserCog,
};
