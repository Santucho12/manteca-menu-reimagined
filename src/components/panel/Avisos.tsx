import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

/** La franja ambar de advertencia de Plan Reminder Pro, para lo que hay que saber antes de seguir. */
export function FranjaDeAviso({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-blue-900">
      <AlertTriangle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}

/** El texto de un enlace dentro de una franja o un parrafo. */
export const ENLACE_EN_TEXTO = 'font-bold underline underline-offset-4 hover:text-primary';
