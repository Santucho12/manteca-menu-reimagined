import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';
import { enlaceDeBusqueda } from './busqueda';

const ESPERA_EN_MS = 150;

/** Busca mientras se escribe: espera un instante sin teclas y recién ahí cambia la dirección. */
export function useBusquedaEnVivo(ruta: string, filtros: Record<string, string>) {
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(temporizador.current), []);
  const buscar = (texto: string) => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      empezar(() => router.replace(enlaceDeBusqueda(ruta, filtros, texto), { scroll: false }));
    }, ESPERA_EN_MS);
  };
  return { buscar, pendiente };
}
