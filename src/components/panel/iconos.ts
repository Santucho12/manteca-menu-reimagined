import {
  BookOpen,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  Receipt,
  ScrollText,
  ShoppingBag,
  Truck,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { EnlaceDelPanel } from '@/lib/acceso/estados';

/** El icono de cada seccion del panel, en la sidebar y en la barra de abajo del celular. */
export const ICONOS: Record<EnlaceDelPanel['clave'], LucideIcon> = {
  inicio: LayoutDashboard,
  menu: BookOpen,
  ventas: ShoppingBag,
  proveedores: Truck,
  gastos: Receipt,
  caja: Wallet,
  cierres: ClipboardList,
  reportes: ChartColumn,
  usuarios: Users,
  auditoria: ScrollText,
  cuenta: UserRound,
};
