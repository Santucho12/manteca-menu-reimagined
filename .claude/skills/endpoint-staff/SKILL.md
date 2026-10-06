---
name: endpoint-staff
description: Usar al crear, cambiar o revisar código de servidor del Sistema Manteca que lee o escribe datos, como acciones de servidor, route handlers, servicios o procesos automáticos.
---

# Código de servidor protegido

Patrón obligatorio para todo código de servidor que toque datos. En este sistema eso es
todo, salvo la lectura pública del menú.

## Cómo se arma

| Capa | Hace | No hace |
|---|---|---|
| Acción de servidor (`'use server'`) o route handler | Verifica sesión y rol, valida con Zod, llama al servicio y traduce sus errores a mensajes | Reglas de negocio |
| Servicio (`.ts`) | La regla de negocio. Recibe el cliente de Supabase como parámetro y datos ya validados; devuelve datos o lanza errores tipados | Saber de HTTP o crear su propio cliente |

- El esquema de Zod es el mismo que usa el formulario.
- **Cliente:** el de la sesión del usuario, siempre. La clave secreta solo en los casos que
  lista `CLAUDE.md` ("Datos y seguridad") y siempre desde su único módulo. Que una policy
  bloquee algo no es motivo para usarla: se revisa la policy.
- Funciones de 20 líneas como máximo: si una acción crece, la lógica se va al servicio.

## Roles

Definidos en `PROPUESTA.md` §1.

| Rol | Qué puede hoy |
|---|---|
| **Anónimo** | Leer el menú publicado (productos y categorías visibles) |
| **Invitado** | Nada. Es el estado de quien se acaba de registrar |
| **Caja** y **Encargado** | Nada, hasta que Santiago defina su alcance (`CLAUDE.md`) |
| **Admin** | Todo, incluidos usuarios, roles, precios y revisión de cierres |

Un usuario **desactivado** no opera aunque conserve su rol.

## Checklist

1. **Sesión válida.** Sin sesión, ninguna ruta protegida responde datos.
2. **Rol mínimo necesario.** Hoy, Admin para todo lo que no sea el menú público.
3. **Validar todo lo que llega** con Zod: tipo, formato, rango y obligatoriedad. Montos en
   centavos enteros, nunca negativos salvo que el caso lo pida.
4. **No confiar en el navegador.** El usuario y el local salen de la sesión. Precios y costos
   se leen de la base. Lo esperado de un cierre, los totales y las diferencias se recalculan
   en el servidor; el navegador manda lo declarado y nada más.
5. **Anular, no borrar.** Ventas, cierres, compras, gastos y movimientos de stock se anulan
   con motivo obligatorio. Productos, insumos y proveedores se desactivan.
6. **Auditoría.** Toda creación, modificación o anulación deja usuario, fecha y, si
   modifica, valor anterior y nuevo.
7. **Excluir lo anulado y lo desactivado** de los números. Sigue visible en el historial.
8. **Listados paginados**, con filtro de fechas donde aplique.
9. **Doble envío.** El botón se deshabilita mientras se envía, pero la protección real va en
   la base: una restricción única (un cierre por turno y local, una importación por
   período) hace que el segundo envío falle en vez de duplicar.
10. **Archivos** (el Excel de Fudo). Tipo y tamaño se validan en el servidor, y el archivo
    se lee en el servidor: no se confía en lo que el navegador ya interpretó. Las funciones
    de Vercel aceptan cuerpos de hasta 4,5 MB; si un archivo puede pesar más, se sube
    directo a Storage y el servidor lo lee de ahí.
11. **Errores en español rioplatense**, para una persona:
    - ✅ "No pudimos guardar el cierre. Revisá los montos e intentá de nuevo."
    - ❌ "Error 500: insert failed"
12. **Logs** sin datos personales ni credenciales.

## Tests: se escriben ANTES que el código

TDD (`superpowers:test-driven-development`), de a un caso: se escribe el test, se lo ve
fallar y recién después el código de la acción **y del servicio** que lo hace pasar. Si ya
hay código escrito sin sus tests, se borra y se rehace desde los tests (`CLAUDE.md`).

Corren contra la base de pruebas, sin mocks ni objetos falsos armados a mano: el cliente
que recibe el servicio es el real, con la sesión de cada usuario de prueba.

- Sin sesión → error de autenticación.
- Invitado → error de permisos.
- Caja y encargado → error de permisos, mientras no esté definido su alcance.
- Usuario desactivado → no opera.
- Datos inválidos → rechazo con mensaje claro.
- Usuario, local y totales enviados por el navegador → ignorados.
- La escritura dejó su auditoría.
- Usuario de otro local → no accede, aunque hoy exista un solo local.
- El mismo envío dos veces → no duplica.

La capa de datos (acceso directo con la clave publicable) la cubre `tests-rls`.

## Cierre

`pre-finish`.
