import { useEffect, useRef } from 'react';

/** Muestra el elemento con una animacion la primera vez que entra en pantalla. */
export function useAparecer<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);
  return ref;
}
