# Caja y avisos (pedido 85)

Salió de la revisión lógica del 2026-11-05, módulo por módulo, con Santiago. Lo decidido ahí no
se vuelve a preguntar. Santiago pidió construirlo de corrido (2026-11-14): donde el pedido no
decía cómo, la decisión es de quien construye y está marcada **(decisión al construir)**, para
que la revise al final.

## Por qué

Siete huecos de Caja y de Inicio que quedaron a la vista con las ventas entrando por el Excel:

1. Caja puede editar su propio cierre después de ver la diferencia: puede acomodar el número.
2. Un día que el local no abrió queda "pendiente" para siempre en el control.
3. "Ayer no se cargó el cierre" no sale si ayer no tiene ventas, y con el Excel ayer casi nunca
   las tiene cargadas: el aviso no sale nunca.
4. El aviso de pagos de Inicio mira solo los gastos fijos que vencen en la semana: no cuenta lo
   anotado por pagar ni lo vencido, y no coincide con Próximos pagos de Gastos.
5. "Esta semana contra la anterior" compara cantidad de ventas, no plata.
6. "Más vendidos" dice "Todavía no hay ventas este mes" cuando las hay, pero entraron por el
   Excel, que no trae productos.
7. La diferencia de un cierre se muestra como un total: un faltante en efectivo y un sobrante
   igual en tarjeta dan "Sin diferencia" al lado de "Con diferencia".

## Objetivos

### 1. Caja no edita su cierre

Revierte la regla 4 del pedido 66, por decisión de Santiago.

- Solo el admin edita un cierre guardado. Caja ve el detalle de los suyos, sin "Editar cierre",
  y con la línea "¿Algo está mal? Avisale a un administrador: lo corrige desde el control de
  cierres."
- La pantalla de editar es solo del admin: Caja que escribe la dirección va a su pantalla,
  como en cualquier página de admin.
- El mensaje del segundo cierre del mismo día pasa a "Ya hay un cierre cargado para ese día.
  Si está mal, lo corrige un administrador desde el control de cierres."

### 2. "No abrió"

**(decisión al construir)** El admin marca un día sin cierre como "No abrió" y el día deja de
estar pendiente.

- En el control, cada día pendiente tiene "Cargar cierre" y "No abrió".
- Los días marcados van a una franja aparte, "N días que el local no abrió", cada uno con
  "Deshacer", que lo devuelve a pendiente.
- El filtro de estado suma "No abrió": muestra solo esa franja, abierta.
- Solo el admin marca y deshace. Caja no los ve.
- No se marca un día futuro ni un día que tiene un cierre sin anular.
- Si después alguien carga el cierre de un día marcado, la marca se desactiva sola: el local
  abrió.
- En el reporte de Caja, un día marcado dice "No abrió" en lugar de "Sin cierre".
- En Auditoría figura en el módulo Caja como "Día sin abrir": alta, desactivación y
  reactivación.

### 3. Ayer sin cierre

- El aviso sale si ayer no tiene un cierre sin anular, haya o no ventas cargadas de ayer.
- No sale si ayer está marcado "No abrió", ni si el local todavía no cargó ningún cierre
  (como hoy).

### 4. El aviso de pagos sale de Próximos pagos

- Se arma con la misma lista que Próximos pagos de Gastos: lo por pagar vigente más el próximo
  pago de cada fijo activo.
- Cuenta lo vencido (fecha anterior a hoy) y lo que vence de hoy a 6 días.
- Un solo aviso **(decisión al construir**: la tarjeta de avisos tiene alto fijo y entran
  cinco**)**:
  - solo de la semana: "Esta semana vence 1 pago." / "Esta semana vencen 3 pagos." (como hoy);
  - solo vencidos: "Tenés 1 pago vencido." / "Tenés 2 pagos vencidos.";
  - los dos: "Tenés 2 pagos vencidos y 1 que vence esta semana." / "… y 3 que vencen esta
    semana."
- Lleva a Gastos. Si en total es uno solo, abre su ventana de pago, sea de un fijo o anotado a
  mano.
- Inicio no genera lo por pagar de los fijos: lo deja el proceso de las 3 de la mañana y
  también abrir Gastos **(decisión al construir)**.

### 5. Esta semana contra la anterior, en plata

- La línea, el resumen y el cartel comparan pesos vendidos, no cantidad de ventas.
- Título: "Vas $134.500 arriba" / "Vas $20.000 abajo" / "Vas igual que la semana pasada", con
  pesos redondeados.
- Etiqueta: "▲ $1,2 M vs $1,1 M", con montos cortos. El eje también va en montos cortos.
- Cartel: "Vendido ese día" y "Vendido hasta ese día", con el monto exacto de cada semana.
- Descripción de la tarjeta: "Lo vendido sumado día a día, contra la semana pasada."

### 6. Más vendidos y el Excel

Con ventas del mes sin detalle de productos (las del Excel de Fudo):

- sin ningún producto: en lugar de "Todavía no hay ventas este mes", "Las ventas de este mes
  entraron por el Excel de Fudo, que no trae productos. Acá aparecen los productos de las
  ventas cargadas a mano.";
- con productos: la lista y, debajo, "No cuenta las ventas del Excel de Fudo: ese archivo no
  trae productos."

Sin ventas en el mes sigue "Todavía no hay ventas este mes."

### 7. La diferencia, por medio

- En el control y en Mis cierres, la columna Diferencia lista cada medio que no da exacto:
  "Efectivo: faltan $5.000,00", "Tarjeta de crédito: sobran $5.000,00". Si todos dan exacto,
  "Sin diferencia". Un cierre que espera ventas sigue con "—".
- El titular del detalle deja de sumar: con un solo medio fuera de la tolerancia, "Faltan
  $1.000,00 en efectivo"; con varios, "No cierra en 2 medios de pago". El detalle ya muestra
  cada medio.
- El reporte de Caja sigue con un número por cierre y por empleado (la suma de sus medios)
  **(decisión al construir**: su tabla entra justa en el celular y su gráfico necesita un solo
  número; queda anotado para la revisión del módulo Reportes**)**.

## Lo que no puede pasar

- Que Caja edite un cierre por algún camino: la pantalla, la acción o la función de la base.
- Que un día con cierre sin anular figure como "No abrió", o que marcarlo tape un cierre.
- Que Caja, un invitado o el admin de otro local lean o marquen los días sin abrir.
- Que el aviso de pagos cuente distinto que Próximos pagos.
- Que un faltante en un medio y un sobrante en otro se lean "Sin diferencia".
- Que "Ayer no se cargó el cierre" avise un día marcado "No abrió".

## Cómo, lo decidido

### Base: migración `20261114120000_caja_y_avisos.sql`, con su reversa

- `cierres_editar`: exige admin activo del local del cierre. Cualquier otro, `42501`.
- Tabla `dias_sin_abrir`: `id`, `local_id` (por defecto `local_del_usuario()`), `fecha date`,
  `activo boolean` (por defecto verdadero), `marcado_por` (por defecto `auth.uid()`),
  `fecha_creacion`, `fecha_actualizacion`. Única por local y fecha. RLS activada; se revoca
  todo a `anon` y `authenticated` y se otorga solo `select`. Una policy: el admin activo ve los
  de su local. Triggers `marcar_actualizacion` y `auditar`.
- Se escribe solo por `cierres_marcar_sin_abrir(la_fecha date, marcar boolean)`, `security
  definer`: exige admin activo (`42501`); al marcar rechaza un día futuro (`PC308`) y un día con
  cierre sin anular (`PC307`), y crea la fila o la reactiva; al deshacer, la desactiva.
- Un trigger en `cierres_de_caja`, después de insertar, desactiva la marca activa de ese local
  y ese día.
- No borra ni reescribe datos. La reversa borra la tabla (se pierden las marcas) y devuelve
  `cierres_editar` a Caja.

### Servidor

- `src/lib/caja/sinAbrir.ts`: `diasSinAbrir(cliente, desde, hasta)` y
  `marcarSinAbrir(cliente, fecha, marcar)`, con el mensaje de cada código.
- Acción `marcarSinAbrirDesdeElPanel`, solo admin, con su esquema de Zod (fecha válida y
  `marcar`).
- `editarCierreDesdeElPanel` y la página de editar pasan a `admin`.
- Inicio lee, en su misma tanda, lo por pagar (`pagosPendientes`), los vencimientos tomados y
  las ventas sin detalle del mes; deja de leer los cierres de ayer.

### Cálculo (puro)

- `src/lib/caja/dias.ts`: `diasSinCierre` recibe los días sin abrir y no los cuenta;
  `diasQueNoAbrio` da los marcados del rango que no tienen cierre.
- `src/lib/caja/diferencias.ts`: los medios con diferencia de un cierre y su texto.
- `src/lib/caja/titular.ts`: el titular nuevo.
- `src/lib/inicio/pagos.ts`: de la lista de Próximos pagos, cuántos vencidos, cuántos de la
  semana y la clave del único.
- `src/lib/inicio/semana.ts` y `semanaAcumulada.ts`: en centavos.
- `src/lib/inicio/masVendidos.ts`: qué nota lleva la tarjeta.
- Se van `src/lib/inicio/ayer.ts` y `vencimientos.ts`, que quedan sin uso.

## Lo que queda al constructor

- Dónde va cada texto dentro de su tarjeta y los estilos, con `estetica-panel`.
- Los nombres internos que no figuran acá.

## Restricciones globales

- Flujo de `CLAUDE.md`: TDD estricto, primero el test y verlo fallar; código escrito antes que
  su test se borra y se rehace.
- Tests reales, sin mocks (`vi.mock`, `vi.fn`, `page.route` prohibidos). `*.base.test.ts`
  contra la base de pruebas; puros aparte. La fecha de hoy entra como parámetro. Cada test
  siembra lo suyo y lo limpia.
- Largo: 20 líneas por función en `.ts`, 80 por componente `.tsx`, 300 por archivo; la lógica
  fuera de los `.tsx`.
- Español en nombres, base y mensajes; pantalla en rioplatense con voseo.
- Plata en centavos enteros (`bigint` / `number` entero, nombres `_centavos`); se muestra
  `$1.234,50`. "El día" es el de Argentina.
- Datos con la sesión del usuario y RLS; la clave secreta solo para sembrar y limpiar tests.
  Caja carga su cierre y ve los suyos, nada más. Nada se borra. Toda escritura deja auditoría.
- La migración se aplica solo a la base de pruebas. Aplicarla a la real, mergear y publicar lo
  decide Santiago. La migración trae su reversa.
- Panel con la skill `estetica-panel`. Base con `migracion-supabase` y `tests-rls`; servidor
  con `endpoint-staff`; cierre con `pre-finish`.
- Mientras se construye, cada tarea corre sus tests nuevos y `npm run tipos`. Al cerrar el
  pedido: `npm run verificar` y `npm run e2e` completos, en primer plano y por partes (memoria
  de la máquina).
- Los tipos de Supabase se generan desde pruebas, que tiene además las tablas de Costos
  (pedido 87, postergado): a `tipos.ts` entra solo lo de esta migración.
- Se actualizan `docs/modulos/04-gastos.md`, `06-cierres-de-caja.md`, `08-reportes.md` y
  `09-inicio.md`, las ayudas del panel y `supabase/schema.sql`.
