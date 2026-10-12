import Link from 'next/link';
import type { Aviso } from '@/lib/inicio/avisos';

/** Solo aparece si hay algo que atender; cada aviso lleva a donde se resuelve. */
export function Avisos({ avisos }: { avisos: Aviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <section aria-labelledby="avisos" className="space-y-2">
      <h2 id="avisos" className="font-heading text-xl font-semibold">
        Para atender
      </h2>
      <ul className="bg-card divide-y rounded-xl border">
        {avisos.map((a) => (
          <li key={a.texto}>
            <Link
              href={a.enlace}
              className="block p-4 font-medium underline-offset-4 hover:underline"
            >
              {a.texto}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
