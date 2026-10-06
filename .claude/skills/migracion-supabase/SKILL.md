---
name: migracion-supabase
description: Usar al cambiar la base del Sistema Manteca (una tabla, columna, índice, función, trigger, policy o grant) y al aplicar una migración a la base de pruebas o a la real.
---

# Migración de Supabase

Las migraciones viven en `supabase/migrations/`, sus reversas en `supabase/reversas/` y el
esquema completo en `supabase/schema.sql`.

Con TDD (`CLAUDE.md`): los tests de lo que cambia, incluido el de RLS (`tests-rls`), se
escriben antes que la migración y se los ve fallar.

## Formato

1. **Nombre:** `supabase/migrations/AAAAMMDDHHMMSS_descripcion_corta.sql`: fecha y hora
   (14 dígitos) y la descripción en español y `snake_case`. La CLI de Supabase toma los
   dígitos del principio como versión, así que dos archivos no pueden compartirlos: con
   solo la fecha, dos migraciones del mismo día chocan.
2. **Cabecera:** 2 a 4 líneas en español que dicen qué cambia y por qué, sin tildes para
   evitar problemas de codificación.
3. **Idempotente cuando se pueda:** `if not exists`, `create or replace`,
   `add column if not exists`. Si cambia la firma de una función, `drop function if exists`
   antes.
4. **Backfill explícito:** cambiar un `default` no actualiza las filas existentes; va el
   `update ... where ...`.
5. **Reversa:** cada migración trae su reversa, con el mismo nombre, en
   `supabase/reversas/`. No va en `supabase/migrations/`, porque todo lo que está ahí se
   aplica. Si la migración borra datos, la reversa no los recupera: la cabecera lo dice.
6. **`schema.sql` sincronizado** en el mismo cambio.

## Convenciones

- **Todo en español**, minúsculas y `snake_case`: `proveedores`, `producto_id`. Tablas en
  plural, columnas en singular. Toda tabla lleva `fecha_creacion` y `fecha_actualizacion`.
- **Fechas en UTC** (`timestamptz`). Cuando el negocio razona por día o por turno, la fecha
  operativa (el día en Argentina) va aparte, como `date`.
- **Nada se borra, se anula.** Ventas, cierres de caja, compras, gastos y movimientos de
  stock llevan fecha, usuario y **motivo** de anulación. Lo anulado no cuenta en los
  números, pero sigue en el historial.
- **Lo que deja de usarse se desactiva:** productos, insumos y proveedores llevan su columna
  de activo y conservan el historial.
- **Quién lo hizo:** las tablas operativas guardan el usuario que creó la fila.
- **Auditoría por trigger genérico:** cada alta, cambio y anulación queda con usuario, fecha
  y, en los cambios, valor anterior y nuevo. No depende de que cada endpoint se acuerde.
- **Plata en centavos enteros:** `bigint`, columnas terminadas en `_centavos`. Jamás `float`,
  `double precision` ni `numeric` sin escala para un monto.
- **Costos por unidad de uso** (el gramo de harina, el huevo) pueden tener fracción de
  centavo: van en `numeric(18,6)` de centavos. Se redondea a centavos enteros recién al
  multiplicar por la cantidad, en una sola función con su test.
- **Cantidades exactas:** el stock se lleva en la unidad de uso (gramos, unidades), y la
  conversión desde la unidad de compra (bolsa de 25 kg, maple de 30) es un factor exacto.
- **Local en cada tabla operativa**, con índice, y las policies filtran por él. Es una
  decisión interna: no se menciona en ningún texto para el cliente.
- **Índices** en lo que se busca y filtra: fechas, producto, proveedor, anulación, local.
- **Duplicados frenados por la base:** una restricción única impide subir dos veces el mismo
  período de Fudo o cargar dos cierres del mismo turno.

## Permisos: son DOS capas

| Capa | Qué decide | Se escribe con |
|---|---|---|
| **Grant** | qué columnas y qué verbos tiene cada rol | `grant` / `revoke` |
| **Policy (RLS)** | qué filas, de las que el grant permite | `create policy` |

Supabase otorgaba `select`, `insert`, `update` y `delete` sobre toda tabla nueva de
`public` a `anon` y `authenticated`, y activar RLS no los revoca. Está cambiando ese default
para que exponer una tabla sea opcional, así que no se sabe con cuál arranca cada proyecto.
Por eso **toda tabla nueva revoca todo y otorga explícitamente** solo lo necesario, por
columna cuando hay datos sensibles. Sin el `grant`, la tabla queda inaccesible y parece un
error de RLS:

```sql
revoke all on public.gastos from anon, authenticated;
grant select, insert on public.gastos to authenticated;
grant update (descripcion, categoria_id) on public.gastos to authenticated;
```

> ⚠️ **Un grant por columna dice QUIÉN puede escribir, no CUÁNDO.** Si la regla es "solo
> mientras no esté cerrado" o "una sola vez", hace falta un trigger o una función
> `security definer`.

- Ningún rol de aplicación lleva `delete`: anular y desactivar entran por `update`.
- Nada de `grant ... to anon` salvo el menú publicado, con el porqué escrito al lado. Los
  costos y márgenes nunca van en lo que lee `anon`.
- El rol y el estado activo de un usuario no los escribe el propio usuario.
- La auditoría no se actualiza ni se borra desde ningún rol de aplicación.
- No se re-otorgan `truncate`, `references` ni `trigger`.

**Verificá el resultado, no la ejecución:**

```sql
select table_name, grantee, privilege_type, string_agg(column_name, ', ')
from information_schema.column_privileges
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by 1, 2, 3 order by 1, 2, 3;
```

## RLS

La clave publicable es visible para cualquiera: **la seguridad real vive en los grants y las
policies**, no en el código de la aplicación.

1. **RLS activada siempre**, y con la sección de permisos de arriba.
2. Las policies piensan en invitado, caja, encargado, admin y, para el menú, anónimo.
3. **Hasta que Santiago defina Caja y Encargado**, las policies dan acceso solo a Admin, y
   al público solo el menú visible (`CLAUDE.md`).
4. Un invitado y un usuario desactivado no leen ni escriben nada. Cada fila es accesible
   solo para usuarios de su local. Las notas personales, solo para admins.

Al terminar, decí qué policies se crearon y qué protegen; si algo quedó abierto a
propósito, decilo. Cada tabla nueva trae su test (`tests-rls`).

## Funciones atómicas

Lo que tiene que pasar entero o no pasar va en una función `security definer` con
`set search_path = public` y `raise exception ... using errcode = 'Pxxxx'`:

- importar un reporte de Fudo (todas sus ventas o ninguna);
- anular una importación (revierte ventas, stock y caja esperada en una transacción);
- recibir una compra (suma stock y actualiza el costo actual);
- registrar producción (descuenta insumos y suma producto terminado).

## Aplicar la migración

Las dos bases se crean donde defina Santiago (cuenta, organización, plan y región), y cada
una se fija en su servidor MCP en `.mcp.json`: `supabase-pruebas` y `supabase-real`. **Nunca** se aplica con el servidor
`supabase` general: trabaja a nivel de cuenta, puede apuntar a cualquier proyecto y no
garantiza en qué base escribe.

1. **Pruebas.** `apply_migration` con `supabase-pruebas`. Si hay varias migraciones, se
   aplican todas y se verifica una sola vez al final.
2. **Verificar en pruebas.** Una migración está verificada cuando:
   - una consulta confirma columnas, tipos, defaults, grants y policies;
   - `get_advisors` no deja nada sin explicar, si tocó permisos, funciones o RLS;
   - su reversa corre y la migración se vuelve a aplicar sin errores, las dos con
     `execute_sql`: con `apply_migration` quedarían registradas como migraciones y las dos
     bases dejarían de coincidir;
   - pasa `npm run verificar`.

   Si falla, se corrige y se verifica una vez más. Si a la segunda no cierra, se frena y se
   avisa con el error concreto.
3. **Real, solo con OK de Santiago.** Verificada en pruebas, se le pide el OK diciendo qué
   cambia. Con el OK, `apply_migration` con `supabase-real` y la misma consulta de
   verificación, de solo lectura. Los tests nunca corren contra la real.
4. **Las dos bases iguales.** `list_migrations` tiene que dar la misma lista en las dos. Si
   la real quedó atrás, se dice.
5. **Tipos.** Se regeneran una vez al final con `generate_typescript_types` de
   `supabase-pruebas`.

🔴 **Lo que no se hace nunca:**

- **Aplicar a la real algo que no pasó por pruebas**, aunque sea una línea y aunque la base
  de pruebas no responda. Si pruebas está caída, se espera: a la real no va nada.
- **Publicar código que usa un cambio de esquema antes de que su migración esté verificada
  en la real.** Si ya pasó, no se aplica a la real salteando pruebas: se le avisa a
  Santiago con dos salidas (esperar a pruebas o volver la publicación a la versión
  anterior) y decide Santiago.
- **Pedir el OK de una migración que borra o reescribe datos** sin decir antes qué se
  pierde y cómo se vuelve atrás.

Al cerrar, decí en qué base quedó aplicada y verificada: pruebas, real, o las dos.
