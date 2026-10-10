import { altaDe } from '@/lib/auditoria/consultas';
import type { Cliente } from '@/lib/supabase/cliente';

type Props = { cliente: Cliente; tabla: string; id: string };

/** Quien cargo el dato y cuando, sin entrar a Auditoria: sale de su registro de alta. */
export async function CargadoPor({ cliente, tabla, id }: Props) {
  const alta = await altaDe(cliente, tabla, id);
  if (!alta) return null;
  return (
    <p className="text-muted-foreground text-sm">
      Cargado por {alta.persona} el {alta.fecha}
    </p>
  );
}
