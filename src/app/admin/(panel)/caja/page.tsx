import type { Metadata } from 'next';
import { BOTON_PELIGRO } from '@/components/panel/estilos';
import { Pantalla } from '@/components/panel/Pantalla';
import { exigirPagina } from '@/lib/acceso/servidor';
import { fechaDelFondoSugerido, fondoSugerido } from '@/lib/caja/consultas';
import { avisoDelFondo } from '@/lib/caja/fondo';
import { diaEnArgentina } from '@/lib/fechas';
import { montoParaEditar } from '@/lib/gastos/plata';
import { esFechaValida } from '@/lib/gastos/vencimientos';
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

export default async function CargarCierre({ searchParams }: { searchParams: Parametros }) {
  const { cliente, perfil } = await exigirPagina('caja');
  const hoy = diaEnArgentina(new Date());
  const pedida = unValor((await searchParams).fecha);
  // Un dia anterior que quedo sin cargar llega por la URL; un dia futuro o invalido, no.
  const fecha = pedida && esFechaValida(pedida) && pedida <= hoy ? pedida : hoy;
  const [fondo, diaDelFondo] = await Promise.all([
    fondoSugerido(cliente, fecha),
    fechaDelFondoSugerido(cliente, fecha),
  ]);
  const inicial = {
    fecha,
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
  };
  return (
    <Pantalla
      titulo="Cierre de caja"
      subtitulo="Contá lo que hay en la caja y cargalo al terminar el día."
      ayuda="caja"
    >
      <QuienCarga nombre={perfil.nombre} />
      <FormularioDeCierre inicial={inicial} avisoDelFondo={avisoDelFondo(diaDelFondo, fecha)} />
    </Pantalla>
  );
}
