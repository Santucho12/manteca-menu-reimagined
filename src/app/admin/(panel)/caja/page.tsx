import type { Metadata } from 'next';
import { TituloDePagina } from '@/components/panel/TituloDePagina';
import { Button } from '@/components/ui/button';
import { exigirPagina } from '@/lib/acceso/servidor';
import { fondoSugerido } from '@/lib/caja/consultas';
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
      <p className="font-medium">Cargando como {nombre}.</p>
      <Button type="submit" variant="outline" size="sm">
        ¿No sos vos? Cambiar de persona
      </Button>
    </form>
  );
}

export default async function CargarCierre({ searchParams }: { searchParams: Parametros }) {
  const { cliente, perfil } = await exigirPagina('caja');
  const hoy = diaEnArgentina(new Date());
  const pedida = unValor((await searchParams).fecha);
  // Un dia anterior que quedo sin cargar llega por la URL; un dia futuro o invalido, no.
  const fecha = pedida && esFechaValida(pedida) && pedida <= hoy ? pedida : hoy;
  const fondo = await fondoSugerido(cliente, fecha);
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
    <div className="space-y-6">
      <TituloDePagina>Cierre de caja</TituloDePagina>
      <QuienCarga nombre={perfil.nombre} />
      <FormularioDeCierre inicial={inicial} />
    </div>
  );
}
