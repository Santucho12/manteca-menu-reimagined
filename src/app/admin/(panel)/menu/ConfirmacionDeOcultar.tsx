import { Button } from '@/components/ui/button';

type Props = {
  productos: string[];
  enviando: boolean;
  alConfirmar: () => void;
  alVolver: () => void;
};

export function ConfirmacionDeOcultar({ productos, enviando, alConfirmar, alVolver }: Props) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="aviso-de-ocultar"
      className="space-y-3 rounded-lg border p-4"
    >
      <p id="aviso-de-ocultar" className="text-sm font-medium">
        Estos productos se van a ocultar porque quedan sin precio:
      </p>
      <ul className="list-disc pl-5 text-sm">
        {productos.map((nombre) => (
          <li key={nombre}>{nombre}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button disabled={enviando} onClick={alConfirmar}>
          Confirmar
        </Button>
        <Button variant="outline" onClick={alVolver}>
          Volver
        </Button>
      </div>
    </div>
  );
}
