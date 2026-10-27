import { textoDePendientes } from '../usuarios/presentacion';

export type ConFecha = { cantidad: number; desde: string | null };
export type DatosDeAvisos = {
  conDiferencia: ConFecha;
  ayerSinCierre: string | null;
  pendientes: number;
  sinClasificar: ConFecha & { categoriaId: string | null };
  // Sale de los recurrentes, que Inicio lee aparte de los avisos.
  vencenEstaSemana?: number;
};
export type Aviso = { texto: string; enlace: string };

const enPlural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

// Los enlaces llevan la fecha mas vieja: las listas muestran por defecto solo el mes en curso.
function deCierres({ cantidad, desde }: ConFecha): Aviso[] {
  if (cantidad === 0) return [];
  const que = enPlural(cantidad, 'cierre', 'cierres');
  return [
    {
      texto: `Hay ${cantidad} ${que} con diferencia sin revisar.`,
      enlace: `/admin/caja/control?estado=con_diferencia&desde=${desde}`,
    },
  ];
}

function deAyer(ayer: string | null): Aviso[] {
  if (!ayer) return [];
  return [
    {
      texto: 'Ayer no se cargó el cierre de caja.',
      enlace: `/admin/caja/control?desde=${ayer}&hasta=${ayer}`,
    },
  ];
}

const dePendientes = (n: number): Aviso[] =>
  n === 0 ? [] : [{ texto: textoDePendientes(n), enlace: '/admin/usuarios?estado=pendientes' }];

function deGastos({ cantidad, desde, categoriaId }: DatosDeAvisos['sinClasificar']): Aviso[] {
  if (cantidad === 0) return [];
  const que = enPlural(cantidad, 'gasto', 'gastos');
  return [
    {
      texto: `Hay ${cantidad} ${que} sin clasificar.`,
      enlace: `/admin/gastos?categoria=${categoriaId}&desde=${desde}`,
    },
  ];
}

function deVencimientos(n = 0): Aviso[] {
  if (n === 0) return [];
  const texto = n === 1 ? 'Esta semana vence 1 pago.' : `Esta semana vencen ${n} pagos.`;
  return [{ texto, enlace: '/admin/gastos/recurrentes' }];
}

/** Lo que requiere accion, en orden; cada aviso lleva a donde se resuelve. */
export function avisosDeInicio(datos: DatosDeAvisos): Aviso[] {
  return [
    ...deCierres(datos.conDiferencia),
    ...deAyer(datos.ayerSinCierre),
    ...dePendientes(datos.pendientes),
    ...deGastos(datos.sinClasificar),
    ...deVencimientos(datos.vencenEstaSemana),
  ];
}
