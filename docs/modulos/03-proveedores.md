# Proveedores

Módulo 2 de `PROPUESTA.md`. Cuarto paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Tener a mano a quién se le compra, cómo contactarlo y cuánto se le pagó.

## Quién lo usa

Solo Admin. Caja no entra a este módulo.

## Datos de un proveedor

| Dato | Detalle |
|---|---|
| Nombre | Obligatorio |
| Teléfono | El de WhatsApp. Opcional |
| Ubicación | Texto libre. Opcional |
| Qué le comprás | Texto libre, por ejemplo "harina y levadura". Opcional |
| Observaciones | Texto libre. Acá van también el alias, el CBU o el CUIT |

## Pantallas

### Proveedores (`/admin/proveedores`)

- Lista con nombre, qué se le compra, teléfono y lo pagado en el mes.
- Se puede buscar por nombre. La lista está paginada.
- Cada fila tiene el botón de WhatsApp, que abre el chat con ese proveedor. No arma ningún
  pedido. Si el proveedor no tiene teléfono, el botón no aparece.
- Los desactivados no se ven, salvo que se pida verlos.

### Ficha de un proveedor

- Los datos de contacto, con el botón de WhatsApp.
- Los gastos cargados a ese proveedor, del más nuevo al más viejo.
- El total pagado en el mes y en el año.
- Acciones: editar, desactivar y reactivar.

## Reglas

1. Un proveedor no se borra: se desactiva y conserva sus gastos.
2. Un proveedor desactivado no aparece para elegir en un gasto nuevo.
3. Al crear uno con un nombre que ya existe, el sistema avisa y deja seguir.
4. Los totales de la ficha no cuentan los gastos anulados.

## Casos de borde

- Proveedor sin ningún gasto: la ficha muestra el contacto y los totales en cero.
- Teléfono mal escrito: el botón de WhatsApp abre un chat que no existe. Al guardar se
  valida que sean solo números, con el código de área.
- Se desactiva un proveedor con un gasto recurrente activo: el sistema avisa, y el
  recurrente sigue generando hasta que se lo desactive aparte.

## Qué queda en la auditoría

Cada alta, cambio, desactivación y reactivación, con el valor anterior y el nuevo.

## Fuera de alcance

- Materias primas que vende cada proveedor y sus precios.
- Comparar precios entre proveedores.
- Órdenes de compra y pedidos armados por WhatsApp.
- Cuenta corriente, saldos y vencimientos.
- Campos propios para CUIT, alias o CBU.

## Dónde se aparta de la propuesta

| Propuesta | Acá | Por qué |
|---|---|---|
| Materias primas y precio por proveedor | Un texto libre "qué le comprás" | Materia prima es de la segunda fase |
| Orden de compra por WhatsApp | Un botón que abre el chat | Compras es de la segunda fase |

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Qué se le compra | Campo de texto libre |
| WhatsApp | Botón que abre el chat |
| Ficha | Contacto y gastos pagados, con total del mes y del año |
| Datos para pagarle | En Observaciones |

## Parte técnica

Se escribe al construir el módulo: tablas, permisos, acciones de servidor y pruebas.
