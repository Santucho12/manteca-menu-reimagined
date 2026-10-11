# Ventas (sin Fudo): diseño

Pedido 30. Parte de `docs/modulos/05-ventas.md` y de lo decidido con Santiago el
2026-10-10 en la revisión de lógica.

**Excepción de Santiago:** el módulo dice que Ventas no se construye hasta probar la API de
Fudo con las credenciales reales. Santiago decidió construir ahora lo que no depende de Fudo,
conociendo el estado (no hay credenciales y la sincronización no se puede probar sin ellas).
Queda anotado en `PEDIDOS.md`.

Decisiones:

1. Se construyen las ventas a mano completas y la lista de ventas. La tabla de ventas tiene la
   forma de una venta de Fudo (origen, identificador externo, estado, renglones y pagos) para
   que la sincronización las guarde ahí mismo.
2. Quedan para cuando estén las credenciales: traer las ventas de Fudo, vincular productos y
   medios de pago, "Actualizar ahora" y el cálculo de lo esperado en los cierres. Cada medio de
   Fudo se vinculará a uno de los cinco del cierre.
3. La venta a mano elige producto y presentación; el precio sale de esa presentación y se puede
   cambiar.
4. Una venta a mano tiene varios renglones y un solo medio de pago.
5. Los cierres siguen "Esperando ventas" hasta que funcione la sincronización.

## Base

| Tabla | Columnas | Notas |
|---|---|---|
| `canales_de_venta` | `nombre`, `activo` | Único por local sin importar mayúsculas. Arranca con Cheaf, Encargo, Venta a comercios y Otro |
| `ventas` | `origen` (`manual`, `fudo`), `fudo_id`, `fecha` (día en Argentina), `cerrada_en`, `estado` (`cerrada`, `cancelada`, `en_curso`), `total_centavos`, `canal_id`, `comentario`, `anulado`, `motivo_anulacion`, `anulado_por`, `fecha_anulacion`, `creado_por` | Único `(local_id, fudo_id)`. Una manual nace cerrada |
| `renglones_de_venta` | `venta_id`, `producto_id` (nulo si es de Fudo sin vincular), `presentacion_id`, `descripcion`, `cantidad` (`numeric(12,3)` > 0), `precio_unitario_centavos`, `subtotal_centavos` | `descripcion` guarda el nombre al vender |
| `pagos_de_venta` | `venta_id`, `medio` (`efectivo`, `credito`, `debito`, `qr`, `transferencia`), `monto_centavos` | La manual tiene un pago por el total |

`ventas_guardar_manual(datos jsonb) returns uuid` (`security definer`, solo admin activo):
calcula cada subtotal (cantidad × precio, redondeado a centavos) y el total, y crea la venta, sus
renglones y su pago, o nada. Rechaza un día futuro (`PV301`), una venta sin renglones (`PV302`),
un canal desactivado o de otro local (`PV303`) y un producto desactivado o de otro local
(`PV304`).

Reglas en trigger: una venta anulada no se cambia (`PV305`); anular pide motivo (`PV306`); una
venta de Fudo no se anula desde el sistema (`PV307`).

`ventas_totales(desde, hasta, el_origen, el_medio)` (`security invoker`): cobrado y cantidad
de lo que cuenta (cerrado y sin anular), y monto y cantidad de lo cancelado.

RLS: solo el admin activo de su local lee, anula y administra canales. Nadie inserta ventas
directo ni borra. Toda escritura queda en la auditoría.

## Lógica pura (`src/lib/ventas/`)

- `renglones.ts`: `subtotalDe(cantidad, precio)` y `totalDe(renglones)`, con el mismo redondeo
  que la base.
- `esquemas.ts`: la venta a mano (fecha, canal, medio, renglones con producto, presentación,
  cantidad y precio, comentario) y su paso a la base.
- `pantalla.ts`: filtros (fechas, mes en curso por defecto; origen; medio; estado) y textos.
- `opciones.ts`: los productos del menú con cada presentación y su precio, para elegir.

## Pantallas

| Ruta | Qué |
|---|---|
| `/admin/ventas` | Filtros; total cobrado y, aparte, lo cancelado; lista paginada con fecha, origen, canal, medio, total y estado; "Fudo todavía no está conectado" en vez de la última sincronización |
| `/admin/ventas/nueva` | Fecha, canal, medio de pago, renglones (producto y presentación, cantidad, precio), comentario y el total |
| `/admin/ventas/[id]` | Renglones y pagos; "Anular" con motivo si es a mano |
| `/admin/ventas/canales` | Sumar, renombrar, desactivar y reactivar |

La barra suma "Ventas" después de "Menú". La auditoría suma los nombres de estas tablas.

## Restricciones globales

- TDD estricto: test, verlo fallar, commit, código. Sin mocks: contra la base de pruebas.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; pantallas con voseo. Plata en centavos enteros, `$1.234,50`.
- Nada se borra: se anula con motivo; toda escritura queda en la auditoría.
- Solo el admin entra a Ventas; Caja, Encargado e invitado reciben rechazo.
- Solo Santiago autoriza la base real, el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.
