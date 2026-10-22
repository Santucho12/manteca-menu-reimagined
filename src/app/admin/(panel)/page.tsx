import type { Metadata } from 'next';
import { BotonDeAyuda } from '@/components/panel/Ayuda';
import { EncabezadoDePantalla } from '@/components/panel/EncabezadoDePantalla';
import { AYUDAS } from '@/lib/panel/ayudas';
import { EsperaDeAcceso, InicioCaja } from '@/components/panel/Inicios';
import { exigirPagina } from '@/lib/acceso/servidor';

export const metadata: Metadata = { title: 'Inicio' };

// Cada pagina se controla sola: Next.js no vuelve a armar el layout en cada navegacion.
export default async function PaginaInicio() {
  const { perfil, estado } = await exigirPagina('panel');
  if (estado === 'caja') return <InicioCaja nombre={perfil.nombre} />;
  if (estado !== 'admin') return <EsperaDeAcceso />;
  // El tablero del admin entra en la Fase 1.
  return (
    <EncabezadoDePantalla
      titulo="Inicio"
      subtitulo="Cómo viene el mes y qué hay que atender."
      ayuda={<BotonDeAyuda ayuda={AYUDAS.inicio} />}
    />
  );
}
