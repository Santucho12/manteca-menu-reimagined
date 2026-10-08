# Proveedores

Fecha: 2026-10-08. Pedido 26 de `PEDIDOS.md`. Paso 4 del orden de construcción. Rama
`feat/proveedores`.

Qué hace el módulo está en `docs/modulos/03-proveedores.md`. Decisiones de Santiago del
2026-10-08, después de `revision-logica`:

1. Este pedido construye el contacto: lista con búsqueda, ficha, alta, edición, desactivar,
   reactivar, WhatsApp y el aviso de nombre repetido. Lo pagado (columna del mes, gastos y
   totales de la ficha, aviso de gasto recurrente al desactivar) entra con Gastos, que lo
   necesita y va justo después.
2. El teléfono se escribe como sea ("11 2345-6789", "+54 9 11…"). Se guardan solo los
   dígitos en formato internacional (`549` + característica + número) y el botón abre
   `https://wa.me/<teléfono>`.

## Base

Tabla `proveedores`: `id`, `local_id` (por defecto `local_del_usuario()`), `nombre` (1 a
100), `telefono` (opcional, `549` y 10 dígitos), `ubicacion`, `que_compra` (hasta 200),
`observaciones` (hasta 1000), `activo`, `fecha_creacion`, `fecha_actualizacion`. Índice en
`(local_id, nombre)`. Triggers `marcar_actualizacion` y `auditar`.

Permisos: el admin activo lee, inserta y cambia los de su local (policies de RLS). Insertar y
cambiar se otorgan por columna, sin `local_id`: el local sale siempre de la sesión. Nadie
borra. Caja, encargado, invitado, desactivado y el admin de otro local no ven nada; el
visitante, tampoco.

Una sola escritura por acción y de una sola fila: no hacen falta funciones de la base.

## Servidor

`src/lib/proveedores/`:

| Archivo | Qué tiene |
|---|---|
| `telefono.ts` | `normalizarTelefono(texto)`: vacío es `null`; acepta 10 dígitos (con un 0 adelante opcional), `54` + 10 o `549` + 10, y devuelve `549…`; si no, `undefined` (inválido). `urlDeWhatsApp(telefono)` y `telefonoParaMostrar(telefono)` (puros) |
| `esquemas.ts` | Esquema de Zod del formulario y conversión a la fila de la base (puro) |
| `consultas.ts` | Lista paginada (25 por página, como Usuarios) con búsqueda por nombre y filtro activos/desactivados; un proveedor por id |
| `escritura.ts` | Crear (si ya hay uno con el mismo nombre, sin importar mayúsculas, devuelve "confirmar" salvo que venga confirmado), editar, desactivar y reactivar |

Acciones en `src/app/admin/(panel)/proveedores/acciones.ts`, con `ejecutarAccion('admin', …)`.

## Pantallas

| Ruta | Qué hay |
|---|---|
| `/admin/proveedores` | Buscar por nombre, "Ver desactivados", lista paginada con nombre (enlace a la ficha), qué le comprás, teléfono y botón "WhatsApp" si tiene teléfono. Botón "Nuevo proveedor" |
| `/admin/proveedores/nuevo` | Formulario: nombre, teléfono, ubicación, qué le comprás, observaciones. Si el nombre ya existe: "Ya hay un proveedor llamado X. ¿Lo cargás igual?" con "Cargar igual" y "Volver" |
| `/admin/proveedores/[id]` | Ficha: los datos, WhatsApp, "Editar" y "Desactivar" o "Reactivar" |
| `/admin/proveedores/[id]/editar` | El mismo formulario |

La barra del panel suma "Proveedores" después de "Menú".

## Pruebas

RLS de la tabla (lectura, alta, cambio, sin borrar, el local no se elige); teléfono y
esquema (puros); servicios (duplicado, búsqueda, paginado, estados); Playwright: alta,
aviso de repetido, búsqueda, enlace de WhatsApp, edición, desactivar y reactivar, caja e
invitado afuera, capturas en los dos tamaños.

## Restricciones globales

Las de `CLAUDE.md`, como en `2026-10-08-menu-design.md`: Santiago decide base real, merge y
publicación; TDD; sin mocks; 20/80/300 líneas; español y voseo; sesión y RLS, el local de la
sesión, nada se borra, auditoría; migración con `supabase-pruebas`; commits chicos.
