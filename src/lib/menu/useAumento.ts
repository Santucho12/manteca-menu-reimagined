import { useCallback, useState } from 'react';
import type { Resultado } from '../resultado';
import type { CambioDePrecio } from './aumento';
import type { DatosDeAplicarAumento, DatosDeAumento } from './esquemas';

type Acciones = {
  ver: (datos: DatosDeAumento) => Promise<Resultado<CambioDePrecio[]>>;
  aplicar: (datos: DatosDeAplicarAumento) => Promise<Resultado<{ cantidad: number }>>;
};
type Vista = { datos: DatosDeAumento; cambios: CambioDePrecio[] };
type Estado = { vista: Vista | null; mensaje: string | null; listo: string | null };

const VACIO: Estado = { vista: null, mensaje: null, listo: null };

// Lo que se aplica es exactamente lo que se vio: los precios de antes salen de la vista previa.
function aplicacionDe({ datos, cambios }: Vista): DatosDeAplicarAumento {
  return { ...datos, precios: cambios.map((c) => ({ id: c.id, antesCentavos: c.montoCentavos })) };
}

function despuesDeAplicar(resultado: Resultado<{ cantidad: number }>, vista: Vista): Estado {
  if (!resultado.ok) return { ...VACIO, vista, mensaje: resultado.mensaje };
  return { ...VACIO, listo: `Listo: se actualizaron ${resultado.datos.cantidad} precios.` };
}

/** La vista previa del aumento y su aplicacion. */
export function useAumento(acciones: Acciones) {
  const [estado, setEstado] = useState<Estado>(VACIO);
  async function ver(datos: DatosDeAumento) {
    const resultado = await acciones.ver(datos);
    if (resultado.ok) setEstado({ ...VACIO, vista: { datos, cambios: resultado.datos } });
    else setEstado({ ...VACIO, mensaje: resultado.mensaje });
  }
  async function aplicar() {
    if (!estado.vista) return;
    setEstado(despuesDeAplicar(await acciones.aplicar(aplicacionDe(estado.vista)), estado.vista));
  }
  const descartar = useCallback(() => setEstado((e) => ({ ...e, vista: null })), []);
  return { ...estado, cambios: estado.vista?.cambios ?? null, ver, aplicar, descartar };
}
