# El panel desde cero (pedido 43): diseño

## Qué y por qué

El front del panel (`/admin`, con el ingreso) se borró para rehacerlo. Santiago eligió el
2026-10-21 la estética de Plan Reminder Pro, tal cual: está entera en la skill `estetica-panel`.
Lo que hace cada pantalla no cambia: es lo de `docs/modulos/` y lo que comprueban las pruebas de
Playwright que quedaron en `e2e/`. Hoy fallan todas las del panel porque no hay pantallas (404).

## Decisiones de Santiago (2026-10-21)

- Estética de Plan Reminder Pro tal cual, con la marca de Manteca (cuadrado verde con la
  medialuna y "Manteca").
- Colores exactos aunque no pasen el contraste AA (excepción anotada en el pedido 43).
- `framer-motion` 12.36.0, `sonner` 1.7.4 y `lenis` 1.1.20, versiones exactas.
- El bloqueo del zoom en el celular queda a confirmar: mientras tanto no se bloquea.

## Decisiones técnicas (Claude)

1. **Dos layouts raíz.** La carta pasa a `src/app/(carta)/` (`layout.tsx` y `page.tsx`; el CSS y
   el ícono se quedan en `src/app/`). `src/app/admin/layout.tsx` es el layout raíz del panel:
   `<html lang="es-AR">` con las letras, `panel.css`, `metadata` sin indexar, `viewport` con
   `viewportFit: 'cover'`, `TooltipProvider` y el scroll suave.
2. **Dos grupos.** `admin/(acceso)` (ingreso, registro y cambio obligado) con el marco de la
   pantalla de ingreso de PRP, y `admin/(panel)` con el marco del panel (barra lateral, barras
   del celular, `main` con el `Toaster`) y todas las pantallas.
3. **Piezas compartidas** en `src/components/panel/` (marco, encabezado, ayuda, tarjetas,
   tablas, insignias, ventanas, avisos) y `src/components/formularios/` (campos y avisos de
   formulario), con las clases de `piezas.md`. Las clases que se repiten van en
   `src/components/panel/estilos.ts`. Cada componente, hasta 80 líneas.
4. **La lógica de cada pantalla** sigue en `src/lib/<módulo>/pantalla.ts`, que ya existe con sus
   tests. Lo nuevo que decida algo va en un `.ts` con su test primero.
5. **Ayuda ⓘ en cada pantalla principal**, como PRP: el texto de cada una en
   `src/lib/panel/ayudas.ts`, escrito en voseo a partir de su archivo de `docs/modulos/`.
6. **Avisos**: lo que salió bien, con un aviso de `sonner`; los errores, escritos en el formulario
   con `role="alert"` dentro de `main`. Donde una prueba pide un `status` en `main`, la franja de
   resultado de PRP.

## Orden y prueba de cierre de cada fase

| Fase | Qué | Pruebas que la cierran |
|---|---|---|
| 0 | Base: dependencias, layouts, `panel.css`, componentes base, marco, encabezado y ayuda, ingreso, registro, cambio obligado, Inicio de caja e invitado, Mi cuenta | `acceso`, `registro`, `cuenta`, `ayuda` (nueva), `inicio` y `menu-publico` (la carta no cambia) |
| 1 | Inicio del admin | `inicio-admin` |
| 2 | Proveedores | `proveedores` |
| 3 | Gastos, categorías y recurrentes | `gastos`, `gastos-categorias`, `gastos-recurrentes` |
| 4 | Ventas y canales | `ventas`, `ventas-canales` |
| 5 | Caja: cargar cierre, mis cierres, control y detalle | `caja`, `caja-control`, `sidebar` |
| 6 | Menú: panel, productos, categorías, desactivados y aumento | `menu-panel`, `menu-formularios`, `menu-aumento` |
| 7 | Reportes | `reportes` |
| 8 | Usuarios y Auditoría | `usuarios`, `auditoria` |
| 9 | Cierre del pedido | `revision-fase-1`, `npm run verificar`, `npm run e2e` entero y capturas contra `referencias/` |

Cada fase empieza leyendo sus pruebas, su archivo de `docs/modulos/` y su `pantalla.ts`, y corre
primero sus pruebas para verlas fallar. El plan de cada fase se escribe al empezarla.

## Pruebas

- Las pruebas de Playwright que quedaron son el test primero de cada pantalla. No se cambian
  salvo que pidan algo del diseño viejo, y eso se anota.
- Lo que el panel nuevo agrega y ninguna prueba mira (la ayuda ⓘ) lleva su prueba nueva.
- La lógica nueva en `.ts`, con Vitest antes del código.
- El aspecto se comprueba con capturas contra `referencias/` (skill `estetica-panel`), no con
  pruebas: las del diseño viejo se borraron a propósito.

## Fuera de alcance

- Cambiar lo que hace una pantalla.
- La carta pública (solo cambia de carpeta).
- El bloqueo del zoom, hasta que Santiago lo confirme.

## Reglas que valen siempre (`CLAUDE.md`)

- Tests sin mocks: la base es la de pruebas; nada de `vi.mock`, `vi.fn` ni `page.route`.
- Largo: funciones de `.ts` hasta 20 líneas, componentes hasta 80, archivos hasta 300.
- Nombres, comentarios y textos en español; en pantalla, rioplatense con voseo.
- Plata en centavos enteros y mostrada con `src/lib/plata.ts` (`$1.234,50`).
- Versiones exactas en `package.json`, sin `^`.
- Cada archivo se agrega al commit con su ruta; nunca `git add -A`.
- Mergear a `main` y publicar lo decide Santiago.
