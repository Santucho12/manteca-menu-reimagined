# Cierres de caja: diseño

Pedido 28. Parte de `docs/modulos/06-cierres-de-caja.md` y de lo decidido con Santiago el
2026-10-09 en la revisión de lógica:

1. Se construye antes que Ventas. Todo cierre queda "Esperando ventas"; el cálculo de lo
   esperado, la diferencia y el estado es una función pura probada, que Ventas conecta.
2. El gasto que sale de un cierre queda atado a él: en Gastos se cambia su categoría, su
   proveedor y su descripción, no su monto, su fecha ni su medio, y no se anula suelto.
3. El cierre se guarda en una sola operación de la base: cierre, retiros y gastos, o nada.
   Caja no recibe permisos sobre Gastos.
4. Un cierre por día.
5. Tolerancia inicial de $500, que el admin cambia.
6. La fecha se ve, con hoy (Argentina) por defecto; no acepta días futuros.
7. El fondo inicial viene precargado con lo que quedó en la caja en el último cierre.
8. "Quién retiró" es texto libre.

## Base

| Tabla | Columnas | Notas |
|---|---|---|
| `cierres_de_caja` | `fecha`, `cargado_por`, `fondo_inicial_centavos`, `efectivo_centavos`, `credito_centavos`, `debito_centavos`, `qr_centavos`, `transferencia_centavos`, `queda_en_caja_centavos`, `comentario`, `estado`, `esperado_*_centavos` (nulos hasta Ventas), `revisado_por`, `fecha_revision`, `comentario_revision`, `anulado`, `motivo_anulacion`, `anulado_por`, `fecha_anulacion` | Único `(local_id, fecha)` entre los no anulados. Montos `>= 0` |
| `retiros_de_caja` | `cierre_id`, `monto_centavos`, `quien` | |
| `configuracion_de_caja` | `tolerancia_centavos` | Una fila por local, $500 |
| `gastos` | suma `cierre_id` | |

`estado`: `esperando_ventas`, `cierra`, `con_diferencia`, `revisado`, `anulado`. Lo pone un
trigger: al anular, `anulado`; al revisar, `revisado`. `cierra` y `con_diferencia` los pondrá
el recálculo de Ventas.

Funciones (`security definer`, códigos `PC3xx`):

- `cierres_guardar(datos jsonb) returns uuid`: Caja o Admin activos. Rechaza un día futuro
  (`PC301`) y un segundo cierre del día (`PC302`). Crea el cierre a nombre de la sesión, sus
  retiros y un gasto "Sin clasificar" en efectivo de la caja por cada gasto declarado.
- `cierres_fondo_sugerido() returns bigint`: lo que quedó en la caja en el último cierre no
  anulado del local, o nulo.

Reglas en triggers: un cierre anulado no se cambia (`PC303`); anular pide motivo (`PC304`);
al anular, se anulan sus gastos. Un gasto con `cierre_id` no cambia monto, fecha ni medio
(`PC305`) y no se anula suelto (`PC306`).

RLS: el admin activo ve y cambia (revisar, anular) los cierres de su local; Caja activa ve
solo los suyos. Nadie inserta directo ni borra. La tolerancia la ve y la cambia el admin.

## Lógica pura (`src/lib/caja/`)

- `resultado.ts`: `resultadoDelCierre(declarado, ventas, tolerancia)` → esperado,
  diferencia y estado por medio. Efectivo esperado = fondo + ventas en efectivo − retiros −
  gastos de caja.
- `dias.ts`: los días sin cierre de un rango, sin pasar de hoy ni ir antes del primer cierre.
- `esquemas.ts`, `pantalla.ts`: formulario, filtros y textos.

## Pantallas

| Ruta | Quién | Qué |
|---|---|---|
| `/admin/caja` | Caja y Admin | "Cargando como {nombre}. ¿No sos vos? Salir"; formulario sin lo esperado; al guardar, "Guardado" y que el resultado va a estar cuando entren las ventas |
| `/admin/caja/mis-cierres` | Caja | Sus cierres con estado y diferencia |
| `/admin/caja/control` | Admin | Tolerancia; filtros por fechas (mes en curso), persona y estado; paginada; días sin cierre marcados |
| `/admin/caja/cierres/[id]` | Admin, y Caja si es suyo | Lo declarado, esperado y diferencia por medio, retiros, gastos, comentarios; Admin: revisar y anular |

Barra: Caja ve "Cargar cierre", "Mis cierres" y "Mi cuenta"; Admin suma "Caja" (al control)
después de "Gastos". El inicio de Caja lleva a cargar el cierre.

## Restricciones globales

- TDD estricto: test, verlo fallar, commit, código. Sin mocks: contra la base de pruebas.
- 20 líneas por función en `.ts`, 80 por componente, 300 por archivo. Lógica fuera de `.tsx`.
- Español; pantallas con voseo. Plata en centavos enteros, `_centavos`, `$1.234,50`.
- Nada se borra: se anula con motivo; toda escritura queda en la auditoría.
- Caja solo carga su cierre y ve los suyos; Encargado e invitado, nada.
- Solo Santiago autoriza la base real, el merge y publicar.
- Hecho es `npm run verificar` y `npm run e2e` en verde.
