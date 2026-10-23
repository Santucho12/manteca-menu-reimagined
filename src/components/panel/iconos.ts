import {
  BookOpen,
  ChartColumn,
  History,
  LayoutDashboard,
  ListChecks,
  Receipt,
  ShoppingBag,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { EnlaceDelPanel } from '@/lib/acceso/estados';

// Plan Reminder Pro no tiene estas secciones: los eligio Claude (skill estetica-panel).
export const ICONOS_DEL_PANEL: Record<EnlaceDelPanel['clave'], LucideIcon> = {
  inicio: LayoutDashboard,
  menu: BookOpen,
  ventas: ShoppingBag,
  proveedores: Truck,
  gastos: Receipt,
  caja: Wallet,
  reportes: ChartColumn,
  cierres: ListChecks,
  usuarios: Users,
  auditoria: History,
  cuenta: UserCog,
};
