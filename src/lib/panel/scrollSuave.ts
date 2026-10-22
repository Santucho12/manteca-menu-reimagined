import Lenis from 'lenis';

let lenis: Lenis | null = null;

const VENTANAS_Y_LISTAS = '[role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper]';

/** Hay un contenedor con scroll propio (ventana, desplegable, tabla) entre el nodo y la pagina. */
function dentroDeOtroScroll(nodo: HTMLElement): boolean {
  for (let el: HTMLElement | null = nodo; el && el !== document.body; el = el.parentElement) {
    if (el.closest(VENTANAS_Y_LISTAS)) return true;
    const { overflowY } = getComputedStyle(el);
    const desplaza = overflowY === 'auto' || overflowY === 'scroll';
    if (desplaza && el.scrollHeight > el.clientHeight) return true;
  }
  return false;
}

/**
 * El scroll suave de Plan Reminder Pro, con sus mismos valores. Va siempre, aunque el sistema
 * tenga "reducir movimiento" (Plan Reminder Pro lo decide asi a proposito).
 */
export function arrancarScrollSuave(): void {
  if (lenis || typeof window === 'undefined') return;
  lenis = new Lenis({
    lerp: 0.065,
    wheelMultiplier: 0.9,
    smoothWheel: true,
    syncTouch: true,
    syncTouchLerp: 0.052,
    touchInertiaMultiplier: 28,
    touchMultiplier: 1,
    prevent: dentroDeOtroScroll,
    autoRaf: true,
  });
}

/** Vuelve arriba de todo al instante, al cambiar de pantalla. */
export function volverArriba(): void {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
}
