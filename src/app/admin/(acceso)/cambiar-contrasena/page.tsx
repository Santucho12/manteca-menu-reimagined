import type { Metadata } from 'next';
import { TituloDeAcceso } from '@/components/formularios/Acceso';
import { exigirPagina } from '@/lib/acceso/servidor';
import { FormularioCambioObligado } from './FormularioCambioObligado';

export const metadata: Metadata = { title: 'Cambiá tu contraseña' };

// Mientras no la cambie, el resto del panel la manda de vuelta aca. Salir siempre se puede.
export default async function PaginaCambioObligado() {
  const { perfil } = await exigirPagina('cambiar-contrasena');
  return (
    <>
      <TituloDeAcceso
        inicio="Cambiá tu"
        resaltado="contraseña"
        subtitulo={`${perfil.nombre}, entraste con una contraseña temporal. Elegí una nueva para seguir.`}
      />
      <FormularioCambioObligado />
      <form action="/admin/salir" method="post" className="mt-3">
        <button
          type="submit"
          className="w-full h-12 px-4 rounded-xl text-muted-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-secondary"
        >
          Salir
        </button>
      </form>
    </>
  );
}
