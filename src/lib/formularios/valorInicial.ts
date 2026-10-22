import type { FieldValues, Path, UseFormRegister, UseFormRegisterReturn } from 'react-hook-form';

export type Registro<T extends FieldValues> = (
  nombre: Path<T>,
) => UseFormRegisterReturn & { defaultValue?: string; defaultChecked?: boolean };

/**
 * Registra un campo y deja su valor inicial en el HTML del servidor. Sin esto el campo llega
 * vacio y React Hook Form lo llena recien al hidratar: si alguien escribe justo en ese momento,
 * lo escrito se junta con el valor viejo ("500" + "600") porque el cursor se va al final.
 */
export function conValorInicial<T extends FieldValues>(
  register: UseFormRegister<T>,
  inicial: T,
): Registro<T> {
  return (nombre) => {
    const campo = register(nombre);
    const valor = (inicial as Record<string, unknown>)[nombre];
    if (typeof valor === 'boolean') return { ...campo, defaultChecked: valor };
    if (typeof valor === 'string' || typeof valor === 'number') {
      return { ...campo, defaultValue: String(valor) };
    }
    return campo;
  };
}
