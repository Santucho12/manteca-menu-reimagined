import Image from 'next/image';
import logo from '../../../public/menu/logo-oscuro.png';

/** La marca del panel: el logo de Manteca en dorado, el mismo de la carta. */
export function MarcaDelPanel({ chica = false }: { chica?: boolean }) {
  const imagen = (
    <Image
      src={logo}
      alt="Manteca"
      priority
      className={chica ? 'h-auto w-[104px]' : 'h-auto w-[150px]'}
    />
  );
  if (chica) return imagen;
  return (
    <div className="flex flex-col gap-1">
      {imagen}
      <span className="text-muted-foreground text-xs font-medium tracking-wide">
        Sistema de gestión
      </span>
    </div>
  );
}
