import { Button } from '@/components/ui/button';
import { CONFIRMAR, preguntaDe, type AccionConConfirmacion } from '@/lib/usuarios/pantalla';

type Props = {
  accion: AccionConConfirmacion;
  nombre: string;
  enviando: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
};

export function Confirmacion({ accion, nombre, enviando, alConfirmar, alCancelar }: Props) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-sm">{preguntaDe(accion, nombre)}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant={CONFIRMAR[accion].variante} disabled={enviando} onClick={alConfirmar}>
          {CONFIRMAR[accion].texto}
        </Button>
        <Button variant="outline" disabled={enviando} onClick={alCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
