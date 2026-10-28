import Image from 'next/image';
import { cn } from '@/lib/utils';

// El logo de Manteca en dorado sobre blanco (Santiago, 2026-10-26).
const TAMANOS = {
  lateral: {
    caja: 'flex flex-col items-center gap-1.5',
    recuadro: '',
    logo: 'w-[124px]',
    lema: 'text-[8px] font-bold text-muted-foreground/80 uppercase tracking-[0.18em] whitespace-nowrap',
  },
  barra: {
    caja: 'flex items-center',
    recuadro: 'px-2.5 py-1.5 rounded-lg',
    logo: 'w-[96px]',
    lema: null,
  },
  ingreso: {
    caja: 'flex flex-col items-center text-center',
    recuadro: 'px-6',
    logo: 'w-[200px]',
    lema: 'text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]',
  },
} as const;

/** El logo de Manteca sobre blanco, con el lema. Para el lector es una sola imagen. */
export function Marca({ tamano }: { tamano: keyof typeof TAMANOS }) {
  const { caja, recuadro, logo, lema } = TAMANOS[tamano];
  return (
    <div role="img" aria-label="Manteca" className={caja}>
      <div className={recuadro}>
        <Image
          src="/menu/logo-oscuro.png"
          alt=""
          width={480}
          height={152}
          className={cn('h-auto', logo)}
          priority
        />
      </div>
      {lema ? <p className={lema}>Sistema de gestión</p> : null}
    </div>
  );
}
