import Link from 'next/link';
import { Etiqueta, Panel, Pildora } from '@/components/panel/Piezas';
import type { Aviso } from '@/lib/inicio/avisos';

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <Panel
      etiquetadoPor="avisos"
      className="bg-white"
      etiqueta={
        <Etiqueta as="h2" id="avisos">
          Para atender
        </Etiqueta>
      }
      extra={<Pildora>{avisos.length}</Pildora>}
    >
      <ul>
        {avisos.map((a) => (
          <li key={a.texto} className="border-b last:border-b-0">
            <Link
              href={a.enlace}
              className="block px-6 py-4 font-medium underline-offset-4 hover:underline"
            >
              {a.texto}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
