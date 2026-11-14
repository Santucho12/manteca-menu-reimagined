# Auditoría

Módulo 17 de `PROPUESTA.md`. El mecanismo se construye en el segundo paso, junto con
Usuarios; la pantalla, en el décimo.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Que de cualquier dato se pueda saber quién lo cargó, quién lo cambió y qué decía antes.

## Quién lo usa

Solo Admin.

## Qué se registra

Cada alta, cambio, anulación, desactivación y reactivación de cualquier dato del sistema.

De cada registro se guarda:

| Dato | Detalle |
|---|---|
| Quién | La persona, o "el sistema" si fue un proceso automático |
| Cuándo | Fecha y hora |
| Qué | El módulo y el dato afectado |
| Tipo de acción | Alta, cambio, anulación, desactivación o reactivación |
| Antes y después | En un cambio, el valor anterior y el nuevo de lo que cambió |
| Motivo | En una anulación |

La subida del Excel de Fudo es la excepción a "cada alta": deja un solo registro con el
resumen, no uno por cada venta y cada pago (pedido 84). Se lee "Ventas · Ventas de Fudo" con
el período, la acción "Subida del Excel", y lleva a Ventas filtrada por ese período.

El detalle de qué registra cada módulo está en su propio archivo de `docs/modulos/`.

No se registran los ingresos al sistema ni las consultas. Nunca se guarda una contraseña.

## Pantallas

### Auditoría (`/admin/auditoria`)

- Lista de lo que pasó, de lo más nuevo a lo más viejo.
- Filtros por persona, fechas, módulo y tipo de acción. La lista está paginada.
- Al abrir un registro se ve el valor anterior y el nuevo.
- Desde un registro se puede ir al dato afectado.

### En cada ficha del sistema

Cada gasto, cierre, venta a mano, producto y proveedor muestra quién lo cargó y cuándo, sin
entrar a Auditoría. La historia completa de ese dato se ve en Auditoría, filtrando.

## Reglas

1. Nada se borra en el sistema: se anula o se desactiva.
2. La auditoría no se puede editar ni borrar, ni siquiera por un admin.
3. Se guarda sin vencimiento.
4. El registro lo hace la base sola en cada escritura. No depende de que cada pantalla se
   acuerde de hacerlo.
5. Si una persona se desactiva o cambia de nombre, sus registros siguen asociados a ella.

## Casos de borde

- Un aumento masivo de precios genera un registro por cada precio cambiado, además del
  registro del aumento.
- Una sincronización con Fudo genera un solo registro con el resumen, no uno por venta.
- Un cambio que no modifica ningún valor no genera registro.

## Fuera de alcance

- Registrar ingresos, salidas y consultas.
- Historial propio dentro de cada ficha.
- Exportar la auditoría.
- Deshacer un cambio desde la auditoría.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Cómo se consulta | Una pantalla con todo, filtrable |
| Ingresos al sistema | No se registran |

## Parte técnica

El mecanismo se construyó con Usuarios (pedido 22): la tabla `auditoria`, el trigger
`auditar()` en cada tabla operativa y la lectura solo para el admin de su local. La pantalla
se construyó el 2026-10-09 (pedido 29); el detalle está en
`docs/superpowers/specs/2026-10-09-auditoria-design.md`.

- **Lectura legible:** `src/lib/auditoria/diccionario.ts` traduce cada tabla a su módulo y
  dato y cada columna a su nombre; la plata se ve en pesos, sí/no, fechas de Argentina, y los
  códigos de categoría, proveedor, producto, cierre y persona, con su nombre. Una tabla o
  columna nueva se muestra igual, con el nombre técnico.
- **Enlaces:** cada registro lleva al dato o a la pantalla que lo contiene.
- **Pantallas:** `/admin/auditoria` (últimos 7 días por defecto; persona, "El sistema",
  módulo y acción; paginada) y `/admin/auditoria/[id]` con el antes y el después.
- **Fichas:** gasto, proveedor y producto muestran "Cargado por", leído del registro de
  alta; el cierre ya mostraba quién lo cargó.
- También se registran y se filtran el reseteo y el cambio de contraseña.
- **Subida del Excel (pedido 84):** `ventas_importar_excel` enciende
  `manteca.importando_excel` (local a la transacción) y `auditar()` no escribe filas de
  `ventas` ni de `pagos_de_venta` mientras esté encendida. Al terminar inserta un registro
  `tabla = 'ventas'`, `accion = 'importacion'`, `registro_id = 'excel:<desde>:<hasta>'`, con
  `despues = {desde, hasta, dias, nuevas, actualizadas, iguales, anuladas, total_centavos}`.
  Si la subida falla, la transacción revierte también el registro. En pantalla,
  `datoDelRegistro`, `nombreDelDato` y `enlaceDe` (`src/lib/auditoria/textos.ts`) la tratan
  aparte. Pruebas: `tests/servicios/excel-en-el-sistema.base.test.ts`, los puros de
  `src/lib/auditoria` y `e2e/auditoria.spec.ts`.
