# El Excel de Fudo en el sistema (pedido 84)

Salió de la revisión lógica del 2026-11-05, módulo por módulo, con Santiago. Lo decidido ahí no
se vuelve a preguntar.

## Por qué

Las reglas de Ventas, Caja, Inicio y Reportes se pensaron para la API de Fudo: ventas cada
noche y con productos. Hoy las ventas entran por el Excel "Reporte-Ventas" (pedido 59), que el
admin sube cada tanto y que trae totales por día y medio, sin productos. Eso deja cuatro huecos:

1. Un cierre de un día cuyas ventas todavía no se subieron sale "Con diferencia" por todo lo
   declarado. Caja ve un sobrante falso, Inicio avisa cierres con diferencia que no existen y el
   reporte de Caja culpa a empleados.
2. Nadie sabe hasta qué día están cargadas las ventas: con gastos al día y ventas atrasadas, el
   balance muestra una pérdida que no existe.
3. Ventas por producto y por categoría dejan afuera las ventas del Excel (no tienen renglones):
   no suman lo mismo que Ventas y se rompe "el mismo dato no da distinto en dos pantallas".
4. Subir un Excel deja un registro de auditoría por cada venta y cada pago: miles por mes, que
   tapan todo lo demás. La definición de Auditoría pide un solo registro con el resumen.

## Objetivos

- **Esperando ventas.** Un cierre cuya fecha es posterior al último día con ventas de Fudo
  (sin anular) queda en el estado `esperando_ventas`. Si no hay ninguna venta de Fudo, todos
  esperan. No cuenta como diferencia: no entra en el aviso de Inicio, ni en el filtro "Con
  diferencia" del control, ni en la diferencia por día y por empleado del reporte de Caja.
  - Caja, al guardar y en Mis cierres, ve "Guardado. El resultado va a estar cuando se carguen
    las ventas del día" en lugar de faltantes o sobrantes. El detalle del cierre (admin) muestra
    lo declarado y no muestra esperado ni diferencia.
  - El control de cierres filtra también por "Esperando ventas". Su pastilla va en ámbar.
  - Cuando se sube el Excel que cubre ese día, el cierre se calcula solo (ya se calcula al
    mostrar: no hay nada que recalcular ni guardar).
  - Un día cubierto por el Excel sin ventas sigue como hoy: lo esperado es $0.
  - Las ventas cargadas a mano no cuentan para decidir hasta dónde están cargadas las ventas.
- **Ventas de Fudo cargadas hasta.** El último día con ventas de Fudo sin anular se muestra
  como "Ventas de Fudo cargadas hasta el 28/10" en Inicio (junto al bloque del mes), en cada
  reporte (debajo del filtro de fechas) y en Ventas (junto a "Subir Excel"). Sin ninguna:
  "Todavía no se subieron ventas de Fudo". Si esa fecha es anterior a ayer, el texto va en ámbar.
  Es la regla 7 de Reportes y la regla 4 de Inicio adaptadas al Excel.
- **Sin detalle de productos.** Ventas por producto y Ventas por categoría suman, al final y
  después de "Sin vincular", una fila "Sin detalle de productos (Excel de Fudo)" con el monto y
  la cantidad de las ventas del período que no tienen renglones. Sin esas ventas, la fila no
  aparece. Con ella, el total del reporte es igual al de Ventas por período. "Más vendidos" de
  Inicio no la muestra (no es un producto).
- **Un registro por subida.** La subida del Excel no audita venta por venta ni pago por pago.
  Deja un solo registro: acción nueva `importacion`, tabla `ventas`, a nombre de quien subió,
  con el período (desde y hasta), los días y lo que devolvió (nuevas, actualizadas, iguales,
  anuladas) y el total en centavos. La pantalla de Auditoría lo muestra como "Subida del Excel
  de Fudo" en el módulo Ventas, con el resumen legible, y lleva a `/admin/ventas` con ese
  período. Las ventas cargadas a mano se siguen auditando como hasta ahora.

## Fuera de alcance

- Lo postergado de Ventas: completar con "sin medio de pago" la diferencia entre la hoja de
  medios y el total del Excel, y la cantidad de ventas pagadas con dos medios. Espera a tener un
  Excel real.
- Lo de los pedidos 85 y 86 (Caja no edita, "No abrió", avisos de ayer y de lo vencido, Gastos,
  Proveedores y Menú).
- La API de Fudo.

## Lo que no puede pasar

- Que un cierre de un día cubierto por el Excel quede "Esperando ventas": taparía un faltante
  real.
- Que Caja vea, por la marca de esperando, algo de las ventas: el dato que recibe es solo si el
  día ya tiene ventas cargadas, nunca montos.
- Que el total por producto o por categoría difiera del total por período del mismo rango.
- Que la subida falle o quede sin ningún registro de auditoría.

## Cómo, lo decidido

- `cierres_con_resultado` suma la columna `ventas_cargadas boolean`: hay alguna venta de Fudo
  sin anular, del mismo local, con fecha mayor o igual a la del cierre. `resultadoDeFila` da
  `esperando_ventas` cuando es falso. El estado del cierre pasa a ser
  `cierra | con_diferencia | esperando_ventas`, y donde hoy se suma o se lista una diferencia
  (control, Inicio, reporte de Caja, Mis cierres, la pantalla después de guardar) se trata
  aparte. El filtro `pendiente` (día sin cierre) sigue igual.
- Una función de lectura para el admin, `ventas_fudo_cargadas_hasta()`, devuelve la fecha o
  null. Inicio y Reportes la leen en la misma tanda de consultas que ya hacen (pedido 73: una
  sola tanda por pantalla).
- La fila "Sin detalle de productos" sale de las funciones de la base de los dos reportes (o de
  una consulta en la misma tanda); la elección queda al constructor, siempre con el resultado de
  arriba.
- Auditoría: `ventas_importar_excel` enciende una marca de la transacción
  (`manteca.importando_excel`); `auditar()` no escribe filas de `ventas` ni de `pagos_de_venta`
  con la marca encendida; al terminar, la importación inserta el registro del resumen. La
  restricción `auditoria_accion_check` suma `importacion`. `registro_id`: `excel:<desde>:<hasta>`.

## Lo que queda al constructor

- Textos exactos, salvo los citados arriba, y dónde va cada texto dentro de su tarjeta,
  siguiendo `estetica-panel`.
- Si la fila "Sin detalle de productos" se arma en SQL o en TypeScript.
- Cómo se nombra el estado en las pastillas y en el filtro (sugerencia: "Esperando ventas").

## Restricciones globales

- Flujo de `CLAUDE.md`: TDD estricto, primero el test y verlo fallar; código escrito antes que
  su test se borra.
- Tests reales, sin mocks (`vi.mock`, `vi.fn`, `page.route` prohibidos). `*.base.test.ts`
  contra la base de pruebas; puros aparte. La fecha de hoy entra como parámetro. Cada test
  siembra lo suyo y limpia.
- Largo: 20 líneas por función en `.ts`, 80 por componente `.tsx`, 300 por archivo; la lógica
  fuera de los `.tsx`.
- Español en nombres, base y mensajes; pantalla en rioplatense con voseo.
- Plata en centavos enteros (`bigint` / `number` entero, nombres `_centavos`); se muestra
  `$1.234,50`. "El día" es el de Argentina.
- Datos con la sesión del usuario y RLS; la clave secreta solo para sembrar y limpiar tests.
  Caja sigue sin leer ventas. Toda escritura deja auditoría.
- La migración se aplica solo a la base de pruebas. Aplicarla a la real y publicar lo decide
  Santiago. La migración trae su reversa.
- Panel con la skill `estetica-panel`. Cambios de base con `migracion-supabase` y `tests-rls`;
  servidor con `endpoint-staff`; cierre con `pre-finish`.
- Mientras se construye, cada tarea corre sus tests nuevos y `npm run tipos`. Al cerrar el
  pedido: `npm run verificar` y `npm run e2e` completos, en primer plano y por partes (memoria
  de la máquina).
- Se actualizan `docs/modulos/05-ventas.md`, `06-cierres-de-caja.md`, `07-auditoria.md`,
  `08-reportes.md` y `09-inicio.md` con lo que cambia.
