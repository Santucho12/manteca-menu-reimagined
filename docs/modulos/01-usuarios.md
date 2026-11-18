# Usuarios y acceso

Módulo 1 de `PROPUESTA.md`. Segundo paso del orden de construcción.

Este archivo tiene dos partes. La definición funcional dice qué hace el módulo y se acordó
con Santiago el 2026-10-06. La parte técnica se escribe al construirlo.

## Para qué

Que cada persona entre con su propia cuenta, vea solo lo que le toca, y que todo lo que se
cargue quede a nombre de quien lo cargó.

## Quién lo usa

| Quién | Qué hace acá |
|---|---|
| Cualquiera | Se registra y entra |
| Invitado | Espera a que un admin le dé acceso |
| Caja | Entra, cambia su contraseña, sale |
| Admin | Lo anterior, y administra las cuentas de los demás |

## Roles y estados

| Rol | Qué puede |
|---|---|
| Invitado | Nada. Es el rol de quien se acaba de registrar |
| Caja | Vender en el mostrador, cargar el cierre de su turno y ver los suyos (pedido 89) |
| Admin | Todo |
| Encargado | Nada. Existe, pero no se puede asignar en esta fase |

Una cuenta está **activa** o **desactivada**. Una cuenta desactivada no entra ni opera,
tenga el rol que tenga, y conserva todo su historial.

## Pantallas

### Registro (`/admin/registro`)

- Pide nombre, email y contraseña. Los tres son obligatorios.
- La contraseña tiene 6 caracteres como mínimo.
- El email no se confirma: funciona como nombre de usuario.
- Al registrarse, la persona queda con la sesión iniciada.
- **La primera cuenta que se crea en el sistema queda como admin.** Todas las siguientes
  nacen como invitado.
- La pantalla es pública, pero no está enlazada desde el menú.

### Ingresar (`/admin/ingresar`)

- Pide email y contraseña.
- Si alguno está mal, el mensaje es uno solo y no dice cuál de los dos falló.
- Tiene un enlace a Registro.
- No hay "olvidé mi contraseña": la resetea un admin.

### Espera del invitado (`/admin`)

- Es lo único que ve un invitado.
- Dice que la cuenta está creada y que un administrador tiene que darle acceso.
- Tiene el botón "Salir".
- Cuando el admin le asigna un rol, entra al recargar la página.

### Cambio obligado de contraseña

- Aparece al entrar con una contraseña temporal.
- Pide la contraseña nueva, de 6 caracteres como mínimo.
- Hasta que la cambia, la persona no puede ir a ninguna otra pantalla.

### Mi cuenta (`/admin/cuenta`)

- Muestra el nombre, el email y el rol. No se pueden editar acá.
- Permite cambiar la contraseña, escribiendo antes la actual.

### Usuarios (`/admin/usuarios`), solo admin

- Lista con nombre, email, rol y estado. Los invitados pendientes van arriba.
- Se puede buscar por nombre o email y filtrar por estado. La lista está paginada.
- El menú de navegación muestra cuántos invitados esperan un rol.

Acciones sobre una cuenta:

| Acción | Qué hace |
|---|---|
| Asignar o cambiar el rol | Ofrece Caja y Admin |
| Rechazar a un invitado | Lo desactiva. No puede entrar ni volver a registrarse con ese email |
| Desactivar | La persona pierde el acceso en el momento, aunque tenga la sesión abierta |
| Reactivar | Vuelve a entrar con el rol que tenía |
| Resetear la contraseña | El sistema genera una temporal y se la muestra al admin una sola vez |
| Corregir nombre o email | Solo el admin. El email no puede repetirse |

### En todas las pantallas del sistema

- Se ve el nombre de quien tiene la sesión iniciada y el botón "Salir".
- La sesión no vence: dura hasta que la persona sale.

## Reglas

1. Nadie puede desactivarse ni cambiarse el rol a sí mismo.
2. El sistema rechaza cualquier cambio que deje cero admins activos.
3. Un admin puede cambiarle el rol a otro admin o desactivarlo, si se cumple la regla 2.
4. La regla de la primera cuenta vale una sola vez: aplica solo si todavía no existe ninguna
   cuenta. La decide la base, para que dos registros simultáneos no terminen los dos como
   admin.
5. Una contraseña temporal sirve hasta que se usa. Un reseteo nuevo reemplaza a la anterior.
6. Un admin no resetea su propia contraseña: la cambia desde Mi cuenta.
7. Una cuenta desactivada no entra aunque tenga una contraseña temporal pendiente.
8. Caja entra a `/admin` y llega directo a Vender (pedido 89; antes llegaba a la carga de su
   cierre).

## Mensajes

| Situación | Texto |
|---|---|
| Email o contraseña incorrectos | "El email o la contraseña no coinciden. Revisalos e intentá de nuevo." |
| Cuenta desactivada | "Tu cuenta está desactivada. Hablá con el administrador." |
| Email ya registrado | "Ya hay una cuenta con ese email." |
| Invitado esperando | "Tu cuenta ya está creada. Un administrador tiene que darte acceso." |
| Intento de dejar cero admins | "Tiene que quedar al menos un administrador activo." |
| Contraseña temporal generada | "Pasale esta contraseña a {nombre}. Se la vamos a pedir cambiar apenas entre. No la vas a poder ver de nuevo." |

## Casos de borde

- Dos personas se registran al mismo tiempo cuando no hay ninguna cuenta: una sola queda
  como admin.
- Un admin desactiva a alguien que está usando el sistema: su próxima acción falla y ve el
  mensaje de cuenta desactivada.
- Un invitado rechazado intenta registrarse otra vez con el mismo email: ve "Ya hay una
  cuenta con ese email".
- El único admin olvida su contraseña: nadie puede reseteársela desde la aplicación. Se
  resuelve directo en la base, con autorización de Santiago. Para evitarlo conviene que haya
  dos admins.
- Doble clic en "Registrarme" o en "Guardar": no crea dos cuentas ni aplica dos veces el
  cambio.

## Qué queda en la auditoría

- El alta de cada cuenta.
- Cada cambio de rol, con el rol anterior y el nuevo.
- Cada rechazo, desactivación y reactivación.
- Cada reseteo de contraseña: quién lo pidió y para quién. Nunca la contraseña.
- Cada corrección de nombre o de email, con el valor anterior y el nuevo.
- Que alguien cambió su propia contraseña. Nunca la contraseña.

## Fuera de alcance

- Emails de confirmación o de recuperación.
- Recuperar la contraseña sin pasar por un admin.
- Entrar con Google u otro proveedor.
- Segundo factor de autenticación.
- Vencimiento automático de la sesión.
- El rol Encargado y los permisos a medida por persona.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Primer admin | La primera cuenta que se registra |
| Último admin | Nadie se baja a sí mismo y nunca quedan cero admins activos |
| Reseteo de contraseña | Temporal generada por el sistema, con cambio obligado al entrar |
| Quién se registra | Registro abierto; el admin puede rechazar |
| Emails | No se usan en esta fase |
| Sesión | Abierta hasta "Salir", con el nombre siempre a la vista |
| Datos propios | Cada uno cambia su contraseña; nombre y email, solo el admin |
| Largo de la contraseña | 6 caracteres como mínimo, el mismo que pide Supabase Auth (2026-10-07) |

## Para la publicación

- El dueño se registra apenas se publica, antes de compartir la dirección con nadie: es lo
  que cierra el riesgo de la regla de la primera cuenta.
- La confirmación de email ya está apagada en los dos proyectos de Supabase, por decisión de
  Santiago (verificado el 2026-10-06 leyendo la configuración de cada uno). Al pasar a los
  proyectos nuevos quedó encendida y Santiago la volvió a apagar (2026-10-30 en pruebas y 2026-10-31 en la real).
- El registro de cuentas del proyecto real quedó abierto. Cerrarlo hasta la publicación
  achica el riesgo de la regla de la primera cuenta; lo decide Santiago.
- Los ingresos y registros salen del servidor, así que Supabase Auth los cuenta todos con la
  IP de Vercel y su límite (unos 30 inicios cada 5 minutos) es uno solo para todo el local.
  Alguien que pruebe contraseñas al azar podría dejar a todos sin entrar unos minutos. Antes
  de publicar, Santiago decide: subir ese límite en el proyecto real, pasarle a Supabase la
  IP de cada persona, o frenar los intentos por IP en Vercel.
- Antes de aplicar las migraciones a la base real, comprobar que no tenga cuentas
  (`select count(*) from auth.users` da 0): si hubiera alguna, quedaría como invitado y
  nadie sería admin.

## Parte técnica

Construido en el pedido 22. El detalle está en
`docs/superpowers/specs/2026-10-07-usuarios-design.md` y en su plan.

- **Base:** `locales`, `perfiles` (una fila por cuenta de Supabase Auth), `acciones_de_cuenta`
  y `auditoria`, en tres migraciones: `20261007150000_usuarios_y_auditoria` (tablas),
  `20261007150100_usuarios_funciones_y_reglas` y `20261007150200_usuarios_triggers_y_permisos`.
  La base decide la primera cuenta admin, frena que alguien se cambie el rol o se desactive y
  que queden cero admins activos, y anota cada alta y cada cambio en la auditoría.
- **Reseteos y correcciones:** antes de cambiar una contraseña o un email con la clave
  secreta, el servidor anota la acción en `acciones_de_cuenta`. La base la usa una sola vez y
  solo si tiene menos de 10 minutos: así sabe que lo pidió un admin y no la persona. Un email
  cambiado sin esa acción se rechaza.
- **Sesión:** `@supabase/ssr` con `src/proxy.ts`. Cada página y cada acción controla el
  acceso en el servidor (`src/lib/acceso/`).
- **Desactivar:** además de marcar el perfil, bloquea la cuenta en Supabase Auth.
- **Pruebas:** RLS de las cuatro tablas, reglas de la base, servicios y pruebas en vivo de cada
  pantalla. Las sesiones de prueba se abren una vez por corrida.
- **Entorno de la aplicación:** `npm run dev` carga `.env.local` antes que cualquier otro
  archivo de entorno, y Playwright no reutiliza un servidor que ya estaba abierto.

Las tres migraciones están aplicadas en la base real desde el 2026-10-08, con el OK de
Santiago. La primera cuenta que se registre ahí queda como admin.
