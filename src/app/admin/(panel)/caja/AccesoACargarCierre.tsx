import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ACCESO_PRINCIPAL, ICONO_DE_ACCESO } from '@/components/panel/estilos';

/** El botón de arriba de Caja: la acción principal, con el + en su círculo. */
export function AccesoACargarCierre() {
  return (
    <Link href="/admin/caja" className={ACCESO_PRINCIPAL}>
      <span className={ICONO_DE_ACCESO}>
        <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
      </span>
      Cargar cierre
    </Link>
  );
}
