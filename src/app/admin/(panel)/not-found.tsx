import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pantalla } from '@/components/panel/Pantalla';

/** Lo que no existe y lo que no le corresponde a quien entra se ven igual: no se revela cual es. */
export default function NoEncontrado() {
  return (
    <Pantalla
      titulo="No encontramos esta página"
      subtitulo="Puede que el enlace esté mal o que ya no exista."
    >
      <EnlaceDeVolver href="/admin">Volver al inicio</EnlaceDeVolver>
    </Pantalla>
  );
}
