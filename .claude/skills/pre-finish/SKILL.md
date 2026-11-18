---
name: pre-finish
description: Usar al terminar cualquier cambio de código del Sistema Manteca, antes de decir que algo está hecho, de commitear o de mover un pedido a Completados en PEDIDOS.md.
---

# Check de cierre (pre-finish)

Los pasos concretos de "Cuándo algo está hecho" (`CLAUDE.md`). Se corre al terminar cada
cambio de código, junto con `superpowers:verification-before-completion`: nada se afirma sin
la salida del comando a la vista. Si hay una rama, después sigue
`superpowers:finishing-a-development-branch`.

> 🔴 **Hecho es probado en local: pasaron los pasos 1 y 2**, con la aplicación apuntando a la
> base de pruebas. Si uno no se pudo correr, no está hecho: el pedido queda en "Pendientes"
> con la nota de qué falta. Una excepción la decide solo Santiago, conociendo el estado real
> (`CLAUDE.md`, "Quién decide").

## 1. `npm run verificar` (siempre)

Corre lint, tipos, **todos** los tests y build, en ese orden, y se corta en el primer error.

- Todos los tests, no solo los del archivo tocado, contra la base de pruebas y sin mocks.
- Si la tarea agregó funcionalidad, trajo sus tests, escritos antes que el código.
- Si el lint falla por el largo de una función o de un archivo, se divide el código. La
  regla no se desactiva.
- Un test que falla aunque no lo hayas tocado también se informa, con su nombre y su salida.

## 2. 🔴 Prueba en vivo con Playwright (siempre)

Los tests en verde no alcanzan. Hay que usar lo que se hizo como lo usaría la persona del
local, con un navegador sin ventana (con `E2E_A_LA_VISTA=1` se ve).

1. Cada flujo tiene su prueba en `e2e/`. Si la tarea agregó o cambió un flujo, se escribe o
   se actualiza esa prueba: entra con el rol que corresponde, toca los botones, completa los
   formularios, guarda, edita, anula y filtra.
2. La prueba **comprueba el resultado**: que el dato aparezca, que el número cambie, que el
   aviso se genere, que un dato inválido muestre su mensaje. No alcanza con que no explote.
3. Entra también con un rol que no debería poder (por ejemplo, un invitado) y comprueba que
   no puede.
4. Mientras trabajás, `npm run e2e -- <archivo>`. Para cerrar, `npm run e2e` entero.
5. Saca capturas en escritorio y en celular (los cierres y las notas se cargan desde el
   teléfono). **Abrilas con Read y miralas**: encabezado tapando contenido, tablas que se
   desbordan, texto cortado, solapamientos.

Si lo que se hizo no tiene pantalla propia (un proceso automático, una regla del servidor),
la prueba entra a la pantalla donde se ve su efecto y lo comprueba.

**Si Playwright no puede correr:**

- **Faltan los usuarios de prueba o la base de pruebas está pausada:** se siembra
  (`npm run sembrar:pruebas`) o se reactiva, y se vuelve a correr. Es parte de la tarea, no
  un motivo para saltear el paso.
- **Otra falla** (no levanta la aplicación, la base de pruebas no responde): no está hecho.
  Se informa qué falló, con la salida, y el pedido queda en "Pendientes".

El paso 2 no se reemplaza por "los tests pasan" ni por "lo probé a mano".

## 3. Reglas de código

Sobre lo que tocaste (`CLAUDE.md`, "Reglas de código"):

- Las funciones y los archivos respetan los límites (los controla el lint del paso 1).
- La lógica está en archivos `.ts`, no dentro de los componentes.
- Nombres, comentarios y lo nuevo de la base, en español.
- Ningún test simula la base, `fetch` ni módulos del proyecto.
- La clave secreta no aparece fuera de su único módulo.

## 4. Estilos (si tocaste algo visual)

- En el panel (`/admin`), lo nuevo sigue la skill `estetica-panel`: sus colores (`panel.css`),
  sus piezas y sus componentes base. Las capturas se comparan con las de su carpeta
  `referencias/`, en los mismos tamaños.
- En la carta pública, lo nuevo usa los colores de `globals.css`.
- No hay guía de estilos que consultar ni actualizar (pedido 23).

## 5. Reglas de negocio sensibles

Si tocaste alguna de estas áreas, verificá que se siga cumpliendo lo que dice
`PROPUESTA.md`:

| Si tocaste… | Verificar |
|---|---|
| **Dinero** | Centavos enteros, nada de punto flotante. Casos límite de redondeo cubiertos con tests |
| **Cualquier dato operativo** | No se borra: se **anula con motivo**, quién y cuándo. Lo anulado no cuenta en los números pero sigue en el historial |
| **Productos, insumos, proveedores** | Se **desactivan**, no se borran, y conservan su historial |
| **Cualquier escritura** | Dejó su **auditoría** (usuario, fecha, valor anterior y nuevo) |
| **Usuarios y permisos** | El invitado no ve ni hace nada. Solo el admin asigna roles. Un usuario desactivado no opera. Caja vende en el mostrador, carga el cierre de su turno y ve los suyos, sin ver ventas ni anular; en todo lo demás, caja y encargado reciben rechazo |
| **Ventas en el mostrador** | El precio y el total los calcula el servidor con el menú. Un doble toque no duplica la venta. Suman a la caja esperada del día |
| **Ventas a mano** | Suman a los reportes, y a la caja esperada solo si se cobraron en la caja del local |
| **Cierres de caja** | Lo esperado sale de las ventas del día o turno y se calcula en el servidor. El cierre queda a nombre de quien lo cargó |
| **Gastos y compras** | En la primera fase la compra de mercadería se carga como gasto, con su proveedor. Cuando exista el módulo Compras, deja de ser un gasto. Nunca se cuenta dos veces |
| **Costos y precios** | Un cambio de costo de insumo recalcula todos los productos que lo usan. El precio del menú es el mismo con el que se calcula la ganancia |
| **Stock** | Se lleva en unidad de uso; la conversión desde la unidad de compra es exacta. El stock negativo genera aviso, no se esconde |
| **Menú web** | Lo oculto no se publica. Nunca se exponen costos ni márgenes al público |
| **Cualquier consulta** | Excluye lo anulado y lo desactivado donde corresponde. Filtra por local. Está paginada |

## 6. Español rioplatense

Todo texto nuevo en pantalla usa voseo natural:
- ✅ vos / tenés / podés / cargá / confirmá / revisá / subí
- ❌ tú / tienes / puedes / cargue / carga

Vale para etiquetas, botones, mensajes de error, avisos y textos de ayuda. Los errores se le
explican a una persona, no a un programador.

## 7. Documentación consistente (si cambiaste una regla)

Si la tarea cambió una regla de negocio, un estado, una columna o una convención, buscá el
término viejo en todo el repo antes de cerrar: `CLAUDE.md`, `PROPUESTA.md`, `docs/` y **las
skills**. Si tocó el esquema, `supabase/schema.sql` tiene que reflejar la migración.

🔴 `PROPUESTA.md` es para el cliente: ningún texto que le llegue menciona que el sistema
viene preparado para varios locales.

## 8. Variables de entorno (si agregaste una)

- `.env.example`: presente y vacía, con el comentario de qué es y de dónde se saca.
- `.env.local`: con el valor de la base de pruebas.
- Los valores de la base real se cargan solo en Vercel.
- Si es sensible, sin prefijo `NEXT_PUBLIC_` y leída desde un solo módulo.

## 9. Migraciones

Si la tarea incluyó una migración (`migracion-supabase`), decí en qué base quedó aplicada y
verificada: pruebas, real, o las dos. El código que usa un cambio de esquema no se publica
hasta que la migración esté verificada en la base real.

## 10. Limpieza

- Sin código muerto ni comentado "por las dudas".
- Sin mensajes de depuración en la consola.
- Sin claves ni credenciales en el repo.

## 11. Actualizar `PEDIDOS.md`

- **Pasaron los pasos 1 y 2:** el pedido va a "Completados" con la fecha y cómo se verificó
  (por ejemplo: "`npm run verificar` y `npm run e2e` en verde; capturas revisadas").
- **Si no:** queda en "Pendientes" con la nota de qué falta.

## Cierre

Informá con honestidad qué corrió, qué pasó y qué quedó pendiente. Si un test falla, decilo
con su salida. Si algo quedó a medias, decilo. **Nunca afirmes que está listo si no se
verificó.**
