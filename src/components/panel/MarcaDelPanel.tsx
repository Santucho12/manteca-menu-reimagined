import Image from 'next/image';
import logo from '../../../public/menu/logo-oscuro.png';

/** La marca del panel: el logo de Manteca en dorado, el mismo de la carta. */
export function MarcaDelPanel({ chica = false }: { chica?: boolean }) {
  return (
    <Image
      src={logo}
      alt="Manteca"
      priority
      className={chica ? 'h-auto w-[104px]' : 'h-auto w-[150px]'}
    />
  );
}
