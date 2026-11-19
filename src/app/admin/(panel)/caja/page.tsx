import type { Metadata } from 'next';
import { BOTON_PELIGRO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { cierreACargar } from '@/lib/caja/cierreACargar';
import { fechaDelFondoSugerido, fondoSugerido } from '@/lib/caja/consultas';
import type { Cliente } from '@/lib/supabase/cliente';
import { estadoDelMostrador, tiposParaVender } from '@/lib/vender/consultas';
import { avisoDelFondo } from '@/lib/caja/fondo';
import { diaEnArgentina } from '@/lib/fechas';
import { montoParaEditar } from '@/lib/gastos/plata';
import { unValor } from '@/lib/usuarios/presentacion';
import { FormularioDeCierre } from './FormularioDeCierre';

export const metadata: Metadata = { title: 'Cargar cierre' };

type Parametros = Promise<Record<string, string | string[] | undefined>>;

// Quien carga se ve arriba: el cierre queda a nombre de la sesion y no se puede elegir a otro.
function QuienCarga({ nombre }: { nombre: string }) {
  return (
    <form action="/admin/salir" method="post" className="flex flex-wrap items-center gap-3">
      <p className="text-sm font-semibold">Cargando como {nombre}.</p>
      <button type="submit" className={`${BOTON_PELIGRO} bg-rose-50`}>
        ¿No sos vos? Cambiar de persona
      </button>
    </form>
  );
}

type Pedido = { fecha?: string; turno?: string };

// El cierre que se carga sale del estado del mostrador, y con el su fondo sugerido.
async function leerCierreACargar(cliente: Cliente, pedido: Pedido, hoy: string) {
  const { fecha, turno } = cierreACargar(pedido, hoy, await estadoDelMostrador(cliente));
  const [fondo, diaDelFondo, tipos] = await Promise.all([
    fondoSugerido(cliente, fecha, turno),
    fechaDelFondoSugerido(cliente, fecha, turno),
    tiposParaVender(cliente),
  ]);
  const controlados = tipos
    .filter((t) => t.seControla)
    .map((t) => ({ canalId: t.id, nombre: t.nombre }));
  return { fecha, turno, fondo, diaDelFondo, controlados };
}

export default async function CargarCierre({ searchParams }: { searchParams: Parametros }) {
  const hoy = diaEnArgentina(new Date());
  const parametros = await searchParams;
  // Un dia o un turno que quedo sin cargar llega por la URL; un dia futuro o invalido, no.
  const pedido = { fecha: unValor(parametros.fecha), turno: unValor(parametros.turno) };
  const { perfil, datos } = await exigirPaginaYLeer('caja', (cliente) =>
    leerCierreACargar(cliente, pedido, hoy),
  );
  const { fecha, turno, fondo, diaDelFondo, controlados } = datos;
  const inicial = {
    fecha,
    turno: turno === 1 ? ('1' as const) : ('2' as const),
    fondoInicial: fondo === null ? '' : montoParaEditar(fondo),
    efectivo: '',
    credito: '',
    debito: '',
    qr: '',
    transferencia: '',
    quedaEnCaja: '',
    comentario: '',
    retiros: [],
    gastos: [],
    controles: controlados.map((t) => ({ canalId: t.canalId, total: '', cantidad: '' })),
  };
  return (
    <Pantalla
      titulo="Cierre de caja"
      subtitulo="Contá lo que hay en la caja y cargalo al terminar el turno."
      ayuda="caja"
    >
      <QuienCarga nombre={perfil.nombre} />
      <FormularioDeCierre
        inicial={inicial}
        avisoDelFondo={avisoDelFondo(diaDelFondo, fecha)}
        tipos={controlados}
      />
    </Pantalla>
  );
}
