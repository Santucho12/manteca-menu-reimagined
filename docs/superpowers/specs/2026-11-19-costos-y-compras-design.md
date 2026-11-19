# Materia prima, Costos y Compras: diseño técnico

Qué hace cada módulo, sus pantallas y sus reglas: `docs/modulos/10-materia-prima.md`,
`11-costos.md` y `12-compras.md`. Este archivo dice cómo se construyen. Pedidos 94 a 97.
Santiago los sumó el 2026-11-19, como excepción a "lo de la segunda fase no se construye por
adelantado", y delegó las decisiones de la revisión lógica de ese día ("lo que creas mejor").
Reemplaza el diseño del pedido 87 (`2026-11-06-costos`, en la rama respaldada).

## Restricciones globales

- TDD: cada test se escribe antes que su código y se lo ve fallar. Código escrito antes que
  su test se borra y se rehace desde el test.
- Tests reales, sin mocks: nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni
  clientes falsos. Lo que toca datos va en `*.base.test.ts` contra la base de pruebas
  (mantecatest, la de `.env.local`); el cálculo puro, en `*.test.ts` sin base. Cada test
  siembra y limpia lo suyo. La fecha de hoy entra como parámetro.
- Largo: 20 líneas por función en `.ts`, 80 por componente en `.tsx`, 300 por archivo, sin
  blancos ni comentarios. La lógica no vive en los `.tsx`. La regla de ESLint no se apaga.
- Español en nombres, base, comentarios y mensajes; voseo en pantalla.
- Plata en centavos enteros (`bigint`, `_centavos`). El costo por unidad de uso tiene
  fracción de centavo: se calcula con `numeric` en la base y se redondea al centavo una sola
  vez, al final del costo de la presentación.
- Cada operación con la sesión del usuario y RLS. Solo Admin activo de su local. Nada para
  `anon`. Ningún `delete`: se desactiva o se anula, con motivo.
- Toda escritura deja auditoría por el trigger genérico `public.auditar()`.
- Toda tabla lleva `local_id not null default public.local_del_usuario()`.
- Cada migración con su reversa en `supabase/reversas/`, `schema.sql` al día y tests de RLS
  (`tests-rls`). Se aplica a la base de pruebas; a la real, solo con el OK de Santiago. Nada
  se publica en producción: se trabaja en local, contra la base de pruebas.
- Panel con la skill `estetica-panel`. Código de servidor con `endpoint-staff`.
- Hecho = `npm run verificar` y `npm run e2e` enteros en verde. Mientras se construye, cada
  tarea corre solo sus tests y `npm run tipos`.
- Decide Santiago: aplicar a la real, publicar y toda excepción.

## Orden y pedidos

Cada pedido se cierra completo (base, servidor, pantalla, e2e) antes del siguiente, en la
rama `feat/costos-y-compras`, apilada sobre `feat/ventas-por-tipo` porque el 97 toca la venta
del mostrador (pedido 89).

| Pedido | Qué | Depende de |
|---|---|---|
| 94 | Materia prima: insumos y formas de compra, con precio de referencia | — |
| 95 | Recetas y Costos: receta, presentaciones, márgenes, pantalla Costos, aviso en Inicio | 94 |
| 96 | Compras: pedido, recepción, gasto generado, "Es una compra" en Gastos | 94 (y 95 para ver el efecto en Costos) |
| 97 | Costo guardado en cada venta y reporte "Ganancia por producto" | 95 |

Un plan por pedido, en `docs/superpowers/plans/`, escrito al empezar cada uno.

## Base

### Pedido 94: `insumos` y `formas_de_compra`

```sql
create type public.unidad_de_uso as enum ('g', 'ml', 'unidad');

insumos (
  id, local_id, nombre text 1..100, unidad_de_uso public.unidad_de_uso not null,
  observaciones text null 1..500, activo boolean default true, fechas)

formas_de_compra (
  id, local_id, insumo_id not null references insumos,
  proveedor_id null references proveedores,
  como_se_compra text 1..100 not null,           -- "Bolsa de 25 kg"
  contenido numeric(14,3) not null check (> 0),  -- en la unidad de uso del insumo
  precio_referencia_centavos bigint null check (> 0),
  activo boolean default true, fechas)
```

- Trigger de reglas (`PI3xx`): insumo y proveedor del mismo local; insumo activo para una
  forma nueva; la unidad de uso no cambia si el insumo está en una receta o una compra
  (`PI301`, se activa con los pedidos 95 y 96).
- `costo_de_insumos()`, `stable`, `security invoker` (RLS aplica): por insumo, el costo por
  unidad de uso en `numeric` y su origen (`'compra'` con la fecha, `'referencia'` o `null`).
  Mientras no exista Compras, solo mira las referencias; el 96 le suma las compras.

### Pedido 95: recetas, presentaciones y márgenes

```sql
recetas (
  id, local_id, producto_id not null references productos,
  presentacion_id null references presentaciones,  -- null: la receta de una unidad
  rinde numeric(10,3) not null default 1 check (> 0),
  desperdicio_porcentaje numeric(5,2) not null default 0 check (between 0 and 50),
  activo boolean default true, fechas,
  unique nulls not distinct (producto_id, presentacion_id))

renglones_de_receta (
  id, local_id, receta_id references recetas, insumo_id references insumos,
  cantidad numeric(14,3) not null check (> 0), activo boolean default true, fechas,
  unique (receta_id, insumo_id))

costos_de_presentacion (
  id, local_id, presentacion_id unique references presentaciones,
  unidades numeric(10,3) not null check (> 0),
  agregado_centavos bigint not null default 0 check (>= 0), fechas)

configuracion_de_costos (
  id, local_id unique,
  margen_objetivo_porcentaje integer not null default 65 check (between 1 and 95),
  margen_minimo_porcentaje integer not null default 50 check (between 0 and 95),
  check (minimo <= objetivo), fechas)
```

- Separadas de las tablas del Menú: `productos`, `presentaciones` y `precios` las lee el menú
  público, y los costos no pueden llegar ahí.
- `recetas_guardar(el_producto, la_presentacion, rinde, desperdicio, renglones jsonb)`,
  `security definer`, `set search_path = ''`: exige admin activo de ese local; crea o
  actualiza la receta, hace upsert de cada renglón (reactivándolo) y desactiva los que no
  vinieron, en una transacción. Rechaza (`PK3xx`) un insumo de otro local, uno inactivo que
  no estaba ya en la receta, insumos repetidos, una lista vacía y una presentación que no es
  de la categoría del producto. Una presentación vuelve a "usa la receta del producto"
  desactivando su receta propia.
- **El cálculo vive en la base, en un solo lugar:** `costos_de_productos()`, `stable`,
  `security invoker`, devuelve por producto activo y presentación activa: `costo_centavos`
  (redondeado al centavo, mitad hacia arriba) o nulo, y `estado` (`'ok'`, `'sin_receta'`,
  `'sin_unidades'`, `'insumo_sin_precio'`). La usan la pantalla Costos, el aviso de Inicio y,
  en el 97, la venta. Así la pantalla y lo guardado en las ventas no se contradicen.
- El precio, la ganancia, el porcentaje, el sugerido y "debajo del mínimo" son aritmética
  sobre ese costo y el precio del menú: van en TypeScript puro (`src/lib/costos/`), probados
  sin base.

### Pedido 96: compras

```sql
create type public.estado_de_compra as enum ('pedida', 'recibida');

compras (
  id, local_id, proveedor_id not null references proveedores,
  estado public.estado_de_compra not null,
  fecha date null,                     -- el día que llegó; null mientras está pedida
  otros_cargos_centavos bigint not null default 0 check (>= 0),
  total_centavos bigint not null default 0 check (>= 0),  -- lo calcula la base
  factura text null 1..60,
  gasto_id null references gastos,           -- el gasto que generó o del que vino
  por_pagar_id null references gastos_por_pagar,
  clave uuid,                                 -- la misma carga dos veces no duplica
  anulado, motivo_anulacion, anulado_por, fecha_anulacion, creado_por, fechas)

renglones_de_compra (
  id, local_id, compra_id references compras, forma_de_compra_id references formas_de_compra,
  cantidad_pedida numeric(12,3) null, cantidad numeric(12,3) not null check (>= 0),
  precio_unitario_centavos bigint not null check (>= 0),
  subtotal_centavos bigint not null, fechas)

alter table gastos add column compra_id uuid null references compras;  -- solo para mostrar
```

- `compras_recibir(la_compra null, proveedor, fecha, renglones jsonb, otros_cargos, factura,
  pago jsonb, clave)`, `security definer`: recibe un pedido o carga una compra directa. Suma
  el total, y según `pago` crea el gasto pagado (Mercadería, proveedor, total, medio, fecha
  del pago) o el por pagar (vencimiento), en la misma transacción. Rechaza (`PU3xx`) una
  forma de compra de otro proveedor o inactiva, una fecha futura, un total de cero y la
  compra ya recibida o anulada.
- `compras_desde_gasto(el_gasto, renglones, factura)`: para un gasto de caja sin clasificar.
  Le pone categoría Mercadería y el proveedor, no crea otro gasto, y la diferencia entre el
  monto y los renglones va a otros cargos. Rechaza si los renglones lo pasan.
- `compras_anular(la_compra, motivo)`: anula su gasto o su por pagar (rechaza si el por pagar
  ya tiene un pago vigente). Si vino de un gasto de caja, el gasto vuelve a "Sin clasificar".
- `costo_de_insumos()` suma las compras: el último renglón con precio > 0 de una compra
  recibida y no anulada, por fecha de la compra y después por creación, gana sobre la
  referencia.
- `compras_pedir(proveedor, renglones, clave)` crea un pedido. El texto de WhatsApp lo arma
  TypeScript puro con el teléfono del proveedor (`wa.me/<teléfono>?text=`).

### Pedido 97: el costo en la venta

- `alter table renglones_de_venta add column costo_unitario_centavos bigint null check (>= 0)`.
- La función de venta del mostrador (`20261118120100`) completa el costo de cada renglón con
  `costos_de_productos()`. Caja no lee esa columna: su grant de `select` no la incluye.
- `ganancia_por_producto(desde, hasta)`, `security invoker`: por producto, unidades, ventas,
  costo y ganancia de lo vendido sin anular, y cuántos renglones no tienen costo.

## Servidor

Con `endpoint-staff`. Cada módulo con su carpeta en `src/lib/` (`materia-prima`, `costos`,
`compras`): `esquemas.ts` (Zod, el mismo en formulario y acción), `consultas.ts` (lecturas
con la sesión) y el cálculo puro. Las acciones en `src/app/admin/(panel)/<sección>/acciones.ts`
validan con Zod, llaman a la base, revalidan la ruta y devuelven un mensaje en español. El
precio, el costo y los totales salen siempre de la base.

## Pantallas

Con las piezas de `estetica-panel`, como Proveedores y Gastos, cada una con su ayuda "Cómo
funciona", su `loading.tsx` y su lugar en la barra lateral (grupo de Proveedores y Gastos:
Materia prima, Compras, Costos). `costos` sale de `EN_PROXIMAMENTE`.

- 94: `/admin/materia-prima`, `/nuevo`, `/[id]` (ficha con formas de compra) y edición.
- 95: `/admin/costos`, `/admin/costos/productos/[id]`, `/admin/costos/ajustes`; aviso en
  Inicio (`src/lib/inicio/avisos.ts`).
- 96: `/admin/compras`, `/nueva`, `/pedido`, `/[id]` (y recibir); "Es una compra" en Para
  clasificar de Gastos; compras en la ficha de Proveedores; últimos precios en la ficha del
  insumo.
- 97: el reporte "Ganancia por producto" en Reportes.
- La auditoría nombra las tablas nuevas (`src/lib/auditoria/diccionario.ts`).

## Tests

Por pedido: puros del cálculo y de los esquemas; reglas y RLS de cada tabla y función
(`tests/reglas/`, `tests/rls/`: admin de su local ve y escribe; invitado, caja, encargado,
desactivado, `anon` y el admin de otro local, nada; nadie borra); servicios de las consultas
(`tests/servicios/`); Playwright del recorrido en computadora y celular, con capturas, y el
rechazo a caja e invitado. Ejemplos con números de la propuesta: medialuna a $1.000 con costo
$350 da $650 y 65 %.

## Documentos

- `docs/producto.md`: Materia prima, Costos y Compras entran a la fase; se sacan "no calcula
  cuánto cuesta…", "no lleva recetas", "no lleva la cuenta corriente" queda (no hay pagos a
  cuenta), "la compra de mercadería es un gasto" pasa a "la compra genera su gasto", y se
  permite "margen".
- `CLAUDE.md`: alcance con los tres módulos y su excepción, por decisión de Santiago.
- `docs/modulos/03-proveedores.md` y `04-gastos.md`: lo que suma Compras.
- `PROPUESTA.md` no se toca: es del cliente.

## Decisiones que tomó Claude (Santiago: "lo que creas mejor", 2026-11-19)

| Tema | Decisión |
|---|---|
| Precio del insumo | El de la última compra recibida y no anulada; si no hay, el de referencia. Calculado, no guardado |
| Cómo se compra | Por proveedor y presentación (forma de compra), no en el insumo |
| Compra y gasto | La compra genera su gasto de Mercadería; cuenta el día que se paga |
| Compra pagada con la caja | "Es una compra" sobre el gasto de caja, sin otro gasto |
| Presentaciones que no son múltiplos | Receta propia por presentación, opcional |
| Costo de lo vendido | Guardado en cada renglón de venta al vender |
| Pedido por WhatsApp | Entra, opcional; lo que no llegó no queda pendiente |
| Cuenta corriente | Lo por pagar de Gastos, sin pagos parciales |
| IVA | Se carga lo pagado, con impuestos. Supuesto a confirmar con el contador |
| Flete y percepciones | Otros cargos: suman al gasto, no al costo de los insumos |
| Preparaciones (masas, cremas) | Afuera por ahora |
| Stock | Afuera: la recepción no suma stock |
| Reventa | Un insumo en unidades, con una receta de una unidad |
| Mercadería a mano | Se sigue pudiendo, avisando que no actualiza precios |
| Una compra recibida | No se edita: se anula y se carga de nuevo |
