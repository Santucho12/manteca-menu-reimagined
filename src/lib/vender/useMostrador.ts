import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Medio } from '../caja/resultado';
import { useGuardar } from '../gastos/useGuardar';
import { exito, type Resultado } from '../resultado';
import { encolar } from './cola';
import { paquetesDelCatalogo, preciosAlDia, type CategoriaParaVender } from './catalogo';
import type { EleccionDeCobro } from './cobro';
import { EVENTO_DE_LA_TRABA } from '../caja/useEstadoDelTurno';
import { esRechazoDeLaTraba, type VentaGuardada } from './escritura';
import { descuentoEscrito, type DescuentoEscrito } from './descuento';
import type { VentaDelMostrador } from './esquemas';
import {
  cambiarCantidad,
  cambiarPrecio,
  cuentaDeTicket,
  pesarEnElTicket,
  sacarDelTicket,
  sumarAlTicket,
  type ItemDelCatalogo,
  type RenglonDelTicket,
} from './ticket';

/**
 * El ticket que se arma tocando productos. Se muestra y se cobra con los precios del catálogo
 * leído: si vuelve a leerse porque un precio cambió, cada renglón toma el nuevo.
 */
export function useTicket(catalogo: CategoriaParaVender[], inicial: RenglonDelTicket[] = []) {
  const [armado, setTicket] = useState<RenglonDelTicket[]>(inicial);
  const ticket = preciosAlDia(armado, catalogo);
  // La docena variada y lo pesado (pedido 102): la misma cuenta que hace la base al guardar.
  const cuenta = cuentaDeTicket(ticket, paquetesDelCatalogo(catalogo));
  return {
    ticket,
    cuenta,
    totalCentavos: cuenta.totalCentavos,
    sumar: (item: ItemDelCatalogo) => setTicket((t) => sumarAlTicket(t, item)),
    pesar: (item: ItemDelCatalogo, gramos: number) =>
      setTicket((t) => pesarEnElTicket(t, item, gramos)),
    cambiar: (clave: string, cambio: 1 | -1) => setTicket((t) => cambiarCantidad(t, clave, cambio)),
    sacar: (clave: string) => setTicket((t) => sacarDelTicket(t, clave)),
    cambiarPrecio: (clave: string, centavos: number | undefined) =>
      setTicket((t) => cambiarPrecio(t, clave, centavos)),
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
export function useEleccion(inicial: EleccionDeCobro = SIN_ELEGIR) {
  const [eleccion, setEleccion] = useState(inicial);
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
// Sin internet no llega ni al servidor: la venta queda en el equipo y se manda sola después.
function guardarSinConexion(venta: { clave: string; totalCentavos: number }) {
  encolar(localStorage, venta);
  return exito<VentaGuardada>({ id: '', totalCentavos: venta.totalCentavos, sinConexion: true });
}

export function useCobrar(vender: Vender, alCobrar: (venta: VentaGuardada) => void) {
  const router = useRouter();
  const [clave, setClave] = useState(() => crypto.randomUUID());
  async function intentar(datos: Omit<VentaDelMostrador, 'clave'> & { totalCentavos: number }) {
    const venta = { ...datos, clave };
    const enElEquipo = () => guardarSinConexion(venta);
    const resultado = navigator.onLine ? await vender(venta).catch(enElEquipo) : enElEquipo();
    // Si cambió un precio, vuelve a leer el catálogo: el ticket toma el nuevo. Si la traba del
    // cierre rechazó la venta, la ventana del cierre se entera y aparece.
    if (!resultado.ok) router.refresh();
    if (!resultado.ok && esRechazoDeLaTraba(resultado.mensaje)) {
      window.dispatchEvent(new Event(EVENTO_DE_LA_TRABA));
    }
    return resultado;
  }
  return useGuardar(intentar, (venta: VentaGuardada) => {
    setClave(crypto.randomUUID());
    alCobrar(venta);
  });
}

/** El motivo del precio a mano: solo se pide si algún renglón tiene uno (pedido 102). */
export function useMotivoDelPrecio(ticket: RenglonDelTicket[]) {
  const [motivo, setMotivo] = useState('');
  const aMano = ticket.some((r) => r.precioEspecial);
  return { motivo, setMotivo, aMano, listo: !aMano || motivo.trim().length >= 3 };
}

const SIN_DESCUENTO: DescuentoEscrito = { tipo: 'porcentaje', valor: '', motivo: '' };

/** El descuento que se está escribiendo en el cobro (pedido 102): vale cuando tiene número y motivo. */
export function useDescuento(inicial: DescuentoEscrito | null = null) {
  const [abierto, setAbierto] = useState(!!inicial);
  const [escrito, setEscrito] = useState(inicial ?? SIN_DESCUENTO);
  return {
    abierto,
    escrito,
    elegido: abierto ? descuentoEscrito(escrito) : null,
    alternar: () => setAbierto((a) => !a),
    cambiar: (cambios: Partial<DescuentoEscrito>) => setEscrito((e) => ({ ...e, ...cambios })),
    reiniciar: () => {
      setAbierto(false);
      setEscrito(SIN_DESCUENTO);
    },
  };
}
