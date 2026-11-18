import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Medio } from '../caja/resultado';
import { useGuardar } from '../gastos/useGuardar';
import { fallo, type Resultado } from '../resultado';
import { preciosAlDia, type CategoriaParaVender } from './catalogo';
import type { EleccionDeCobro } from './cobro';
import { MENSAJES_DEL_MOSTRADOR, type VentaGuardada } from './escritura';
import type { VentaDelMostrador } from './esquemas';
import {
  cambiarCantidad,
  sacarDelTicket,
  sumarAlTicket,
  totalDelTicket,
  type ItemDelCatalogo,
  type RenglonDelTicket,
} from './ticket';

/**
 * El ticket que se arma tocando productos. Se muestra y se cobra con los precios del catálogo
 * leído: si vuelve a leerse porque un precio cambió, cada renglón toma el nuevo.
 */
export function useTicket(catalogo: CategoriaParaVender[]) {
  const [armado, setTicket] = useState<RenglonDelTicket[]>([]);
  const ticket = preciosAlDia(armado, catalogo);
  return {
    ticket,
    totalCentavos: totalDelTicket(ticket),
    sumar: (item: ItemDelCatalogo) => setTicket((t) => sumarAlTicket(t, item)),
    cambiar: (clave: string, cambio: 1 | -1) => setTicket((t) => cambiarCantidad(t, clave, cambio)),
    sacar: (clave: string) => setTicket((t) => sacarDelTicket(t, clave)),
    vaciar: () => setTicket([]),
  };
}

const SIN_ELEGIR: EleccionDeCobro = {
  medio: null,
  dosMedios: false,
  segundoMedio: null,
  primeroEscrito: '',
};

/** Lo que elige quien cobra: el medio, el segundo si son dos, y con cuánto paga el cliente. */
export function useEleccion() {
  const [eleccion, setEleccion] = useState(SIN_ELEGIR);
  const [pagaCon, setPagaCon] = useState('');
  return {
    eleccion,
    pagaCon,
    setPagaCon,
    cambiar: (cambios: Partial<EleccionDeCobro>) => setEleccion((e) => ({ ...e, ...cambios })),
    // El segundo medio no puede ser el mismo que el primero.
    elegirMedio: (medio: Medio) =>
      setEleccion((e) => ({
        ...e,
        medio,
        segundoMedio: e.segundoMedio === medio ? null : e.segundoMedio,
      })),
    reiniciar: () => {
      setEleccion(SIN_ELEGIR);
      setPagaCon('');
    },
  };
}

type Vender = (datos: unknown) => Promise<Resultado<VentaGuardada>>;

/**
 * Cobra una vez por toque. La clave queda hasta que la venta se guarda: si se corta la conexión
 * y se vuelve a tocar Cobrar, la base devuelve la venta que ya estaba en vez de duplicarla.
 */
export function useCobrar(vender: Vender, alCobrar: (venta: VentaGuardada) => void) {
  const router = useRouter();
  const [clave, setClave] = useState(() => crypto.randomUUID());
  async function intentar(datos: Omit<VentaDelMostrador, 'clave'>) {
    const generico = () => fallo(MENSAJES_DEL_MOSTRADOR.generico);
    const resultado = await vender({ ...datos, clave }).catch(generico);
    // Si cambió un precio, vuelve a leer el catálogo: el ticket toma el nuevo.
    if (!resultado.ok) router.refresh();
    return resultado;
  }
  return useGuardar(intentar, (venta: VentaGuardada) => {
    setClave(crypto.randomUUID());
    alCobrar(venta);
  });
}
