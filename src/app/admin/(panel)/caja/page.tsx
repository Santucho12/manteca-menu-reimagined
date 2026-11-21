import type { Metadata } from 'next';
import { LogOut } from 'lucide-react';
import { ACCESO_SECUNDARIO, ICONO_DE_ACCESO_SUAVE } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import { cierreACargar } from '@/lib/caja/cierreACargar';
import { fechaDelFondoSugerido, fondoSugerido } from '@/lib/caja/consultas';
import type { DatosDeCierre } from '@/lib/caja/esquemas';
import { avisoDelFondo } from '@/lib/caja/fondo';
import { diaEnArgentina } from '@/lib/fechas';
import { montoParaEditar } from '@/lib/gastos/plata';
import type { Cliente } from '@/lib/supabase/cliente';
import { unValor } from '@/lib/usuarios/presentacion';
import { estadoDelMostrador, tiposParaVender } from '@/lib/vender/consultas';
import { CargaDelCierre } from './CargaDelCierre';

export const metadata: Metadata = { title: 'Cargar cierre' };

type Parametros = Promise<Record<string, string | string[] | undefined>>;
type Pedido = { fecha?: string; turno?: string };

// El cierre que se carga sale del estado del mostrador, y con él su fondo sugerido.
async function leerLaCarga(cliente: Cliente, pedido: Pedido, hoy: string) {
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

// El cierre queda a nombre de la sesión: si carga otra persona, sale y entra con su cuenta.
const CambiarDePersona = () => (
  <form action="/admin/salir" method="post">
    <button type="submit" className={ACCESO_SECUNDARIO}>
      <span className={ICONO_DE_ACCESO_SUAVE}>
        <LogOut size={15} aria-hidden="true" />
      </span>
      ¿No sos vos? Cambiar de persona
    </button>
  </form>
);

export default async function CargarCierre({ searchParams }: { searchParams: Parametros }) {
  const hoy = diaEnArgentina(new Date());
  const parametros = await searchParams;
  const pedido = { fecha: unValor(parametros.fecha), turno: unValor(parametros.turno) };
  const { perfil, datos } = await exigirPaginaYLeer('caja', (cliente) =>
    leerLaCarga(cliente, pedido, hoy),
  );
  const { fecha, turno, fondo, diaDelFondo, controlados } = datos;
  const inicial: DatosDeCierre = {
    fecha,
    turno: turno === 1 ? '1' : '2',
    fondoInicial: fondo === null ? '' : montoParaEditar(fondo),
    ...{ efectivo: '', credito: '', debito: '', qr: '', transferencia: '' },
    quedaEnCaja: '',
    comentario: '',
    retiros: [],
    gastos: [],
    controles: controlados.map((t) => ({ canalId: t.canalId, total: '', cantidad: '' })),
  };
  return (
    <Pantalla
      titulo="Cargar cierre"
      subtitulo="Contá lo que hay en la caja al terminar el turno y cargalo."
      acciones={<CambiarDePersona />}
      ayuda="caja"
    >
      <CargaDelCierre
        key={`${fecha}-${turno}`}
        hoy={hoy}
        inicial={inicial}
        quien={perfil.nombre}
        avisoDelFondo={avisoDelFondo(diaDelFondo, fecha)}
        tipos={controlados}
      />
    </Pantalla>
  );
}
