import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { FormularioCambioObligado } from './FormularioCambioObligado';

export const metadata: Metadata = { title: 'Cambiá tu contraseña' };

// Mientras no la cambie, el resto del panel la manda de vuelta aca. Salir siempre se puede.
export default async function PaginaCambioObligado() {
  const { perfil } = await exigirPagina('cambiar-contrasena');
  return (
    <>
      <TituloDePagina>Cambiá tu contraseña</TituloDePagina>
      <p className="text-muted-foreground">
        {perfil.nombre}, entraste con una contraseña temporal. Elegí una nueva para seguir.
      </p>
      <FormularioCambioObligado />
      <form action="/admin/salir" method="post">
        <Button type="submit" variant="ghost">
          Salir
        </Button>
      </form>
    </>
  );
}
