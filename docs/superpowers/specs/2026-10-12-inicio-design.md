# Inicio: diseño

Pedido 33. Parte de `docs/modulos/09-inicio.md` y de lo decidido con Santiago el 2026-10-12 en
la revisión de lógica y en el diseño.

Decisiones:

1. Los avisos "Productos de Fudo sin vincular" y "Las ventas no se sincronizan desde hace más
   de un día", y la fecha de la última sincronización (regla 4), entran con la parte de Fudo
   (pedido 30).
2. Más vendidos: los 5 productos que más plata dejaron en el mes, cada uno con su monto y la
   cantidad por presentación ("3 Unidad · 2 Docena"), como en Reportes. "Sin vincular" no entra.
3. "Ayer no se cargó el cierre" se avisa todos los días; si molesta en los días que el local
   cierra, se ajusta después.
4. "Cierres con diferencia sin revisar" se construye ahora y aparece cuando haya cierres con
   diferencia, es decir, cuando llegue Fudo.
5. Los números del mes, el gráfico y los más vendidos usan el cálculo de Reportes: el mismo dato
   no da distinto en las dos pantallas. Sin migración.

## Pantalla (`/admin`, solo el admin; primero el celular)

1. **Lo que requiere acción**, solo si hay algo. Cada aviso es un enlace:

   | Aviso | Lleva a |
   |---|---|
   | "Hay N cierres con diferencia sin revisar" | `/admin/caja/control?estado=con_diferencia&desde=<el más viejo>` |
   | "Ayer no se cargó el cierre" | `/admin/caja/control?desde=<ayer>&hasta=<ayer>` |
   | "Hay N personas esperando un rol" | `/admin/usuarios?estado=pendientes` |
   | "Hay N gastos sin clasificar" | `/admin/gastos?categoria=<Sin clasificar>&desde=<el más viejo>` |

   El control de cierres y la lista de gastos muestran por defecto el mes en curso: el aviso
   lleva la fecha del caso más viejo para que no quede ninguno afuera. "Ayer sin cierre" no se
   avisa si el local todavía no cargó ningún cierre (no se usa el sistema todavía).

2. **Los números del mes**: ventas, gastos, resultado (o "Sin calcular" sin gastos) y ticket
   promedio, del 1 a hoy contra los mismos días del mes anterior (`periodoAnterior` de
   Reportes), cada uno con su variación.
3. **Mes a mes**: `GraficoPorMes` con `resultadoPorMes` de los últimos 12 meses, del primer día
   del mes de hace 11 meses a hoy.
4. **Más vendidos**: los 5 primeros de `productosDelReporte` del mes, sin "Sin vincular".
   Sin ventas: "Todavía no hay ventas este mes."

Caja e invitado siguen igual: Caja ve su botón para cargar el cierre; el invitado, la espera.

## Código

- `src/lib/inicio/avisos.ts` (puro): `avisosDeInicio(datos)` arma la lista `{ texto, enlace }` a
  partir de las cantidades; sin nada pendiente, la lista vacía.
- `src/lib/inicio/meses.ts` (puro): `ultimosDoceMeses(hoy)` y `masVendidos(productos)`.
- `src/lib/inicio/consultas.ts`: `datosDeAvisos(cliente, hoy)` cuenta con la sesión del admin
  los cierres con diferencia sin revisar (y el más viejo), si ayer tiene cierre y si hay algún
  cierre, los gastos sin anular de la categoría de sistema (y el más viejo) y las personas que
  esperan un rol (`pendientesActuales`).
- `src/components/inicio/`: avisos, números, más vendidos; reusa `Totales` y `GraficoPorMes`.

## Pruebas

- Puros: avisos (cada uno, juntos, ninguno), los 12 meses (cruce de año) y más vendidos (5,
  sin "Sin vincular", menos de 5).
- Base: `datosDeAvisos` con un cierre con diferencia sin revisar sembrado, uno revisado que no
  cuenta, un gasto en "Sin clasificar" y uno anulado que no cuenta, y ayer con y sin cierre
  (con fechas viejas y `hoy` como parámetro).
- En vivo, en los dos tamaños: el admin ve el aviso del gasto sin clasificar sembrado y el
  enlace lo lleva a Gastos con ese gasto; ve un producto sembrado entre los más vendidos y los
  cuatro números; caja sigue viendo su botón.

## Restricciones globales

- TDD estricto: test, verlo fallar, código. Sin mocks: contra la base de pruebas.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; pantallas con voseo. Plata en centavos enteros, `$1.234,50`. No se usa "margen".
- Lo cancelado y lo anulado no cuentan. El día es el día en Argentina.
- Solo el admin ve Inicio con números; Caja ve su botón, el invitado la espera.
- Solo Santiago autoriza la base real, el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.
