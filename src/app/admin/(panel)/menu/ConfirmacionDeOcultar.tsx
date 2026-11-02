import { AvisoParaConfirmar } from './AvisoParaConfirmar';

type Props = {
  productos: string[];
  enviando: boolean;
  alConfirmar: () => void;
  alVolver: () => void;
};

/** Guardar deja productos sin precio: se pregunta antes de ocultarlos. */
export function ConfirmacionDeOcultar({ productos, ...acciones }: Props) {
  return (
    <AvisoParaConfirmar
      titulo="Estos productos se van a ocultar porque quedan sin precio:"
      {...acciones}
    >
      <ul className="list-disc pl-5 text-sm">
        {productos.map((nombre) => (
          <li key={nombre}>{nombre}</li>
        ))}
      </ul>
    </AvisoParaConfirmar>
  );
}
