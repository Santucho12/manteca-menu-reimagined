'use client';

import { WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatearPesos } from '@/lib/plata';
import { leerCola, sacarDeLaCola, type VentaEnCola } from '@/lib/vender/cola';
import { venderDesdeElMostrador } from './acciones';

const CADA = 20_000;

// Manda una por una; la clave hace que la base no la duplique si ya había llegado.
async function mandarLaCola(): Promise<string | null> {
  for (const venta of leerCola(localStorage)) {
    const resultado = await venderDesdeElMostrador(venta).catch(() => null);
    if (!resultado) return null;
    if (!resultado.ok) return resultado.mensaje;
    sacarDeLaCola(localStorage, venta.clave);
  }
  return null;
}

/** Las ventas cobradas sin conexión: se mandan solas al volver internet, y mientras se avisan. */
export function VentasSinMandar() {
  const router = useRouter();
  const [cola, setCola] = useState<VentaEnCola[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const probar = async () => {
      if (leerCola(localStorage).length && navigator.onLine) {
        setError(await mandarLaCola());
        router.refresh();
      }
      setCola(leerCola(localStorage));
    };
    void probar();
    const reloj = setInterval(probar, CADA);
    window.addEventListener('online', probar);
    return () => {
      clearInterval(reloj);
      window.removeEventListener('online', probar);
    };
  }, [router]);
  if (cola.length === 0) return null;
  const total = cola.reduce((s, v) => s + v.totalCentavos, 0);
  return (
    <section
      aria-label="Ventas sin mandar"
      className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <WifiOff size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div>
        <p className="font-bold">
          {cola.length} {cola.length === 1 ? 'venta' : 'ventas'} sin mandar ({formatearPesos(total)}
          )
        </p>
        <p>
          Quedaron en este equipo: se mandan solas cuando vuelve internet. No cierres esta pestaña.
        </p>
        {error ? (
          <p className="mt-1 font-semibold text-rose-700">Una no se pudo guardar: {error}</p>
        ) : null}
      </div>
    </section>
  );
}
