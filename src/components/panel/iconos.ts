import {
  Calculator,
  Search,
  House,
  ChartColumn,
  ListChecks,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Store,
  Truck,
  UserCog,
  UtensilsCrossed,
  CircleDollarSign,
  Users,
  Package,
  type LucideIcon,
} from 'lucide-react';
import type { EnlaceDelPanel } from '@/lib/acceso/estados';

// Plan Reminder Pro no tiene estas secciones: los eligio Claude (skill estetica-panel).
export const ICONOS_DEL_PANEL: Record<EnlaceDelPanel['clave'], LucideIcon> = {
  inicio: House,
  vender: Store,
  menu: UtensilsCrossed,
  ventas: ShoppingBag,
  proveedores: Truck,
  'materia-prima': Package,
  compras: ShoppingCart,
  costos: Calculator,
  gastos: Receipt,
  caja: CircleDollarSign,
  reportes: ChartColumn,
  cierres: ListChecks,
  usuarios: Users,
  auditoria: Search,
  cuenta: UserCog,
};
