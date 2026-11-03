import { textoDelPrecioQuePisa, type PrecioQuePisa } from '@/lib/menu/pisar';
import { AvisoParaConfirmar } from '../AvisoParaConfirmar';

type Props = {
  categoria: string;
  precios: PrecioQuePisa[];
  enviando: boolean;
  alConfirmar: () => void;
  alVolver: () => void;
};

/** Un precio nuevo reemplaza el que la categoria tiene para todos: se pregunta antes de guardar. */
export function ConfirmacionDePisar({ categoria, precios, ...acciones }: Props) {
  return (
    <AvisoParaConfirmar
      titulo={`Este producto está tomando el precio de ${categoria}.`}
      {...acciones}
    >
      <ul className="list-disc pl-5 text-sm">
        {precios.map((precio) => (
          <li key={precio.presentacion}>{textoDelPrecioQuePisa(precio)}</li>
        ))}
      </ul>
      <p className="text-sm">¿Seguro que querés pisarlo?</p>
    </AvisoParaConfirmar>
  );
}
