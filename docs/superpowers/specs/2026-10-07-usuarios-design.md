# Usuarios y acceso

Fecha: 2026-10-07. Pedido 22 de `PEDIDOS.md`. Paso 2 del orden de construcción
(`2026-10-06-mapa-fase-1-design.md`). Rama `feat/usuarios`.

Qué hace el módulo está en `docs/modulos/01-usuarios.md` y no se repite acá. Este spec dice
cómo se construye. Decisiones de Santiago del 2026-10-07:

- La contraseña temporal vale hasta que la persona la cambia; mientras tanto no puede hacer
  nada más en el sistema.
- Mientras no exista Inicio, el admin entra a una página mínima con cuántas personas esperan
  un rol y acceso a Usuarios.
- Los títulos del panel van en Neufile Grotesk. Manic queda para la marca y el menú público,
  porque no dibuja acentos ni la eñe.
- Los campos de contraseña tienen un botón para mostrarla. No hay campo de repetirla.

## Objetivo

Que cada persona entre con su cuenta, vea solo lo que le toca y que todo lo que cambie quede
a su nombre. Deja armado el mecanismo de auditoría que van a usar todos los módulos.

## Enfoque

Los roles viven en una tabla de perfiles. La base hace cumplir las reglas que no se pueden
saltear: RLS, triggers y funciones. El servidor de Next.js valida, orquesta y traduce
errores.

Descartado: guardar el rol en la sesión de Supabase (claims del token). Un cambio de rol o
una desactivación tardaría hasta una hora en aplicarse, y la definición pide que el acceso
se pierda en el momento.

## Base de datos

Una migración, `supabase/migrations/AAAAMMDDHHMMSS_usuarios_y_auditoria.sql`, con su reversa
y `supabase/schema.sql` al día (`migracion-supabase`).

### Tablas

| Tabla | Columnas | Notas |
|---|---|---|
| `locales` | `id`, `nombre`, `activo`, `fecha_creacion`, `fecha_actualizacion` | La migración crea Manteca. Las cuentas nuevas van al local más antiguo |
| `perfiles` | `id` (el de `auth.users`), `local_id`, `nombre`, `email`, `rol`, `activo`, `debe_cambiar_contrasena`, `fecha_creacion`, `fecha_actualizacion` | `rol` es el tipo `rol_usuario`: `invitado`, `caja`, `encargado`, `admin`. El email es único |
| `acciones_de_cuenta` | `id`, `cuenta_id`, `tipo`, `por`, `fecha_uso`, `fecha_creacion`, `fecha_actualizacion` | Lo que el servidor anota antes de resetear una contraseña o corregir un email: el tipo (`reseteo`, `correccion` o `siembra`) y el admin que lo pidió. La base la usa una sola vez y solo si tiene menos de 10 minutos |
| `auditoria` | `id`, `local_id`, `usuario_id`, `tabla`, `registro_id`, `accion`, `antes`, `despues`, `motivo`, `fecha` | `usuario_id` vacío quiere decir "el sistema". `antes` y `despues` guardan solo lo que cambió |

`perfiles.id` referencia a `auth.users` con borrado en cascada: en el sistema nada se borra,
pero los tests limpian las cuentas que crean.

La migración crea un perfil `invitado` para cada cuenta que ya exista en `auth.users`. En la
base de pruebas son las seis cuentas de prueba; en la real no hay ninguna.

### Reglas de la base

| Regla | Cómo |
|---|---|
| La primera cuenta queda como admin; las demás, como invitado | Trigger al crearse una cuenta en `auth.users`. Un bloqueo serializa los registros simultáneos. La decisión vive en una función pura, `rol_de_cuenta_nueva(cuentas)`, que se prueba sola |
| Nadie se cambia el rol ni se desactiva a sí mismo | Trigger antes de actualizar `perfiles` |
| Nunca quedan cero admins activos en un local | El mismo trigger, con un bloqueo por local para que dos admins no se bajen a la vez |
| El email del perfil sigue al de la cuenta, y solo lo cambia un admin | Trigger al actualizarse `auth.users`. Un cambio de email sin una corrección anotada se rechaza |
| Cambiar la contraseña apaga el cambio obligado; un reseteo lo prende | El mismo trigger. Para distinguirlos, el servidor anota cada reseteo y cada corrección en `acciones_de_cuenta` antes de llamar a Supabase Auth, con el admin que lo pidió. A esa tabla solo llega la clave secreta, así que nadie la falsifica desde el navegador. No sirve una marca en `app_metadata`: Supabase Auth guarda la contraseña y el email antes que los metadatos, y la marca llegaría tarde |

Los errores de estas reglas salen con un código propio y el mensaje en español de la
definición.

### Auditoría

- Un trigger genérico, `auditar()`, anota cada alta y cada cambio. Sirve para todas las
  tablas que vengan.
- Calcula qué columnas cambiaron y no anota nada si no cambió ninguna. Cada tabla puede
  excluir columnas de ese cálculo.
- La acción sale del cambio: alta, cambio, desactivación, reactivación y, para las tablas que
  anulan, anulación.
- El autor es el usuario de la sesión. Si el cambio no tiene sesión, es quien indicó el
  servidor, o la propia persona cuando se registra. Si no hay ninguno, queda "el sistema".
- Los cambios de contraseña los anota el trigger de `auth.users`: "reseteo de contraseña",
  con el admin como autor, o "cambio de contraseña", con la persona. Nunca se guarda la
  contraseña.

### Permisos

Toda tabla revoca todo y otorga lo justo, por columna cuando hace falta.

| Tabla | Quién lee | Quién escribe |
|---|---|---|
| `locales` | Un usuario activo, su propio local | Nadie desde la aplicación |
| `perfiles` | Cada uno su perfil, aunque esté desactivado o sea invitado; el admin activo, los de su local | El admin activo, en su local: `nombre`, `rol` y `activo`. Nadie inserta ni borra |
| `auditoria` | El admin activo, la de su local | Nadie: solo los triggers |
| `acciones_de_cuenta` | Nadie desde la aplicación | Nadie desde la aplicación: la anota el servidor con la clave secreta |

El visitante sin sesión no lee nada. Las funciones que usan las políticas
(`es_admin_activo()`, `local_del_usuario()`) se definen con `search_path` fijo.

Que Encargado no se asigne lo controla el servidor: la base lo admite, porque la cuenta de
prueba de encargado necesita tenerlo.

## Sesión y acceso

- Se suma `@supabase/ssr`. Hay dos clientes nuevos: el del servidor, con la sesión de la
  persona en las cookies, y el de `proxy.ts`.
- `src/proxy.ts` refresca la sesión en cada pedido con `getClaims`, como recomienda Supabase
  para Next.js 16. Quien no tiene sesión y pide algo de `/admin` va a `/admin/ingresar`;
  ingreso y registro quedan abiertos.
- El control de verdad está en el servidor. `src/lib/acceso/` lee el perfil con la sesión de
  la persona y decide con una función pura:

| Estado | Qué ve |
|---|---|
| Sin sesión | `/admin/ingresar` |
| Desactivado | Se cierra la sesión y ve "Tu cuenta está desactivada. Hablá con el administrador." |
| Debe cambiar la contraseña | `/admin/cambiar-contrasena`, y nada más |
| Invitado | La espera, en `/admin` |
| Caja | Su página mínima, en `/admin`: su nombre, Mi cuenta y Salir |
| Admin | Lo que pidió |

- Cada página y cada acción del panel declara el rol mínimo, y el servidor lo exige aunque
  la pantalla no muestre el botón.

## Acciones del servidor

Cada acción valida con Zod (el mismo esquema que el formulario), exige la sesión y el rol, y
llama a un servicio de `src/lib/usuarios/` que recibe el cliente por parámetro
(`endpoint-staff`).

| Acción | Quién | Qué hace |
|---|---|---|
| Registrarse | Cualquiera | Crea la cuenta con nombre, email y contraseña |
| Ingresar | Cualquiera | Inicia sesión |
| Salir | Con sesión | Cierra la sesión |
| Cambiar la contraseña | Con sesión | Pide la actual. En el cambio obligado no la pide |
| Asignar rol | Admin | Caja o Admin; no Encargado |
| Rechazar a un invitado | Admin | Lo desactiva |
| Desactivar y reactivar | Admin | Cambia `activo` con su sesión y además bloquea o desbloquea la cuenta en Supabase Auth con la clave secreta |
| Resetear la contraseña | Admin | Anota el reseteo, genera una temporal de 12 caracteres sin letras que se confundan, la pone con la clave secreta y la devuelve para mostrarla una sola vez. No sirve para la propia cuenta |
| Corregir nombre o email | Admin | El nombre, con su sesión; el email, anotando la corrección y con la clave secreta |

La clave secreta se usa solo después de comprobar en el servidor que lo pide un admin
activo, como permite `CLAUDE.md`.

## Pantallas

| Ruta | Qué tiene |
|---|---|
| `/admin/registro` | Nombre, email y contraseña |
| `/admin/ingresar` | Email y contraseña, y enlace a registro |
| `/admin/cambiar-contrasena` | La contraseña nueva |
| `/admin` | Según el estado: espera del invitado, página mínima de caja o página mínima del admin |
| `/admin/cuenta` | Nombre, email y rol; cambio de contraseña |
| `/admin/usuarios` | Lista con búsqueda, filtro por estado y paginada. Invitados pendientes arriba. Las acciones de la tabla de arriba, con confirmación para desactivar y rechazar |
| `/admin/guia-de-estilos` | La guía, ahora solo para admin |

El marco del panel muestra el nombre de quien está, "Salir" y, para el admin, la navegación
con la cantidad de invitados que esperan.

Entra lo que quedó pendiente para el login:

- Botones y campos de 44 px en pantallas táctiles, sin cambiar la computadora.
- El campo con error en la guía.
- Los títulos del panel en Neufile Grotesk.

Las pruebas de Playwright para esto están en `git stash`.

Formularios con React Hook Form y Zod. Se suman `react-hook-form` y `@hookform/resolvers`.

## Pruebas

| Qué | Tipo |
|---|---|
| `rol_de_cuenta_nueva`, la decisión de acceso, el generador de contraseñas y la traducción de errores | Puros |
| Matriz de RLS de `locales`, `perfiles` y `auditoria`: los seis roles de prueba y el visitante, en lectura y escritura, con control positivo (`tests-rls`) | Contra la base |
| Las reglas: cuenta nueva como invitado, no a sí mismo, último admin (también con dos admins que se bajan a la vez), auditoría con el autor correcto, reseteo y cambio de contraseña | Contra la base |
| Cada acción: sin sesión, invitado, caja, encargado y desactivado rechazados; datos inválidos; auditoría | Contra la base |
| Registro, espera, el admin da rol y la persona entra; ingreso con error; desactivar; resetear y cambio obligado; las pantallas táctiles | En vivo |

La infraestructura de pruebas cambia en cinco puntos:

- `clienteComo` reutiliza una sesión por rol dentro de cada archivo, y Playwright guarda la
  sesión de cada rol una vez. Así no se pasa el límite de ráfagas de inicios de sesión de
  Supabase (30).
- La siembra cambia la contraseña de una cuenta de prueba solo si cambió la de `.env.local`:
  cada vez que se la pone, Supabase Auth cierra todas las sesiones de la cuenta, también las
  compartidas.
- `npm run dev` carga `.env.local` antes que cualquier otro archivo de entorno, y Playwright
  no reutiliza un servidor que ya estaba abierto: la aplicación de las pruebas en vivo usa la
  base comprobada.
- La siembra deja a cada cuenta de prueba con su rol, su local y su estado. `adminOtroLocal`
  va a un segundo local que crea la siembra. `desactivado` es un admin inactivo, sin
  bloquear en Supabase Auth, para probar que RLS lo frena aunque tenga sesión.
- Las cuentas que crea un test, y su auditoría, se borran al terminar.

## Pasos de Santiago

- Poner la longitud mínima de contraseña en 8 en los dos proyectos de Supabase
  (Authentication > Sign In / Providers > Email).
- Aplicar la migración a la base real, cuando decida publicar.

## Cuándo está hecho

Pasaron `npm run verificar` y `npm run e2e` en local, contra la base de pruebas, con la
migración aplicada y verificada en pruebas. La base real no se toca en este pedido.

## Fuera de alcance

- Emails de confirmación o recuperación, ingreso con Google y segundo factor.
- Vencimiento de la sesión.
- El rol Encargado y permisos a medida.
- El contenido de Inicio, salvo el aviso de invitados que esperan.
- La pantalla de auditoría (paso 10).
- Las variantes que faltan en la guía y las tipografías en woff2 (con el menú público).

## Restricciones globales

Reglas de `CLAUDE.md` que valen para este spec y su plan.

- **Quién decide:** solo Santiago autoriza aplicar una migración a la base real, publicar en
  producción y cualquier excepción a las reglas.
- **TDD:** primero el test, verlo fallar y commitearlo; después el código. Código escrito
  antes que su test se borra y se rehace.
- **Tests sin mocks:** contra la base de pruebas. Nada de `vi.mock`, `vi.fn` como reemplazo,
  `page.route` ni clientes falsos. La fecha y el azar entran como parámetro.
- **Hecho es probado en local:** `npm run verificar` y `npm run e2e`, los dos.
- **Largo:** 20 líneas por función en `.ts`, 80 por componente en `.tsx`, 300 por archivo. La
  lógica no vive en los `.tsx`.
- **Idioma:** nombres, comentarios, base y mensajes en español; pantallas en rioplatense con
  voseo.
- **Datos y seguridad:** sesión del usuario y RLS; el usuario y el local salen de la sesión;
  nada se borra, se desactiva; toda escritura deja auditoría; la clave secreta solo en
  `src/lib/supabase/secreto.ts` y solo para lo que permite `CLAUDE.md`.
- **Plata en centavos:** no aplica en este módulo.
- **Guía de estilos:** ninguna pantalla define colores, tipografías ni medidas sueltas; los
  cambios estéticos van a la guía.
- **Bases:** migraciones con `supabase-pruebas`; nunca el servidor MCP `supabase` general.
- **Git:** commits chicos en español, cada archivo con su ruta; a `main` por PR con merge
  commit y el OK de Santiago.
