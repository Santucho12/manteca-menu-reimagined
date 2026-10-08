import { useEffect, useState } from 'react';

// Avisa que seccion esta en la franja de arriba de la pantalla.
function observarSecciones(anclas: string[], alVer: (ancla: string) => void) {
  const observador = new IntersectionObserver(
    (entradas) => entradas.forEach((e) => e.isIntersecting && alVer(e.target.id)),
    { rootMargin: '-20% 0px -70% 0px' },
  );
  anclas.forEach((ancla) => {
    const seccion = document.getElementById(ancla);
    if (seccion) observador.observe(seccion);
  });
  return observador;
}

/** La categoria que se esta mirando y si la pagina esta arriba de todo, para la navegacion. */
export function useCategoriaActiva(anclas: string[]) {
  const [activa, setActiva] = useState(anclas[0] ?? '');
  const [arriba, setArriba] = useState(true);
  useEffect(() => {
    const alScrollear = () => setArriba(window.scrollY < 100);
    window.addEventListener('scroll', alScrollear, { passive: true });
    const observador = observarSecciones(anclas, setActiva);
    return () => {
      window.removeEventListener('scroll', alScrollear);
      observador.disconnect();
    };
  }, [anclas]);
  return { activa, arriba };
}
