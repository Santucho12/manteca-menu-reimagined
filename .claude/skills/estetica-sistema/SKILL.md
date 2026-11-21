---
name: estetica-sistema
description: Usar al construir, rediseñar o revisar cualquier pantalla del panel de Manteca (/admin) que no sea Inicio, Ingresar, Crear cuenta ni Cambiar contraseña, para llevarla a la estética de tarjetas blancas de Ventas e Inicio: números con borde teñido y pie con punto, tarjetas de bloque con encabezado y botón píldora, filtros, tablas, insignias y botones.
---

# Estética del sistema: las tarjetas de Ventas e Inicio

## Qué es y dónde vale

Santiago (2026-11-21) eligió la estética de **Ventas** e **Inicio** como la del sistema entero y
pidió replicarla en todas las pantallas del panel. **No se toca con esta skill**:

- **Inicio** (`/admin`): es el modelo, ya está hecho.
- **Ingresar, Crear cuenta y Cambiar contraseña** (`src/app/admin/(acceso)`): llevan el dorado de
  Manteca (`src/estilos/ingreso-dorado.css`), que el resto del panel no usa.

Esta skill **se suma** a `estetica-panel`, que sigue mandando en lo que no dice esta: letras,
radios, tokens de `src/app/admin/panel.css`, movimiento, barra lateral y celular. Si las dos chocan
en una pantalla de este alcance, manda esta.

**Regla de oro: no se inventan clases.** Cada pieza ya existe en el código; se importa o se copia
de su archivo. Si una pieza nueva hace falta en más de una pantalla, sale a
`src/components/panel/` o a `estilos.ts`, no se repite a mano.

## El clima

- **Fondo de la pantalla** gris muy claro (`bg-background`, `#f9fafb`); **todo lo que se lee va en
  tarjetas blancas** (`bg-white`/`bg-card`) con borde fino y sombra suave que crece al pasar el
  mouse.
- **Tinta** `#121B2B` (`text-foreground`, `text-slate-900` en números) y grises fríos
  (`text-slate-500`, `text-slate-400`, `text-muted-foreground`). **Sin dorado**: solo el logo.
- **La regla de color de Santiago (2026-11-21), para todo el sistema**: **verde es que está bien**,
  **rojo que está mal o es una alerta**, **gris que está desactivado, cerrado o no cuenta**. Nada más
  usa esos tres. Lo que solo hay que distinguir (tipos de venta, medios de pago, personas, turnos,
  categorías, secciones, puestos) va en **violeta, rojo o naranja** (Santiago eligió que el rojo también distinga). Las
  funciones que lo aplican: `src/lib/panel/coloresDelSistema.ts` (personas, turnos, acciones),
  `src/lib/vender/colores.ts` (tipos, medios, categorías), `colorDelAviso` y `colorDeBarra` en
  `src/lib/inicio`. Las piezas: `Persona` y `EtiquetaDeColor`
  (`src/components/panel/Etiquetas.tsx`).

| Significado | Color | Ejemplos |
|---|---|---|
| Está bien, entra plata, se cobró, cierra | verde (`emerald`) | Cobrado, Ventas, "Cerrada", "Cierra", alta, Vender |
| Está mal, sale plata, se anuló, falta, alerta | rojo (`rose`) | Gastos, Anuladas, "Con diferencia", turno pendiente, anulación |
| Desactivado, cerrado, no cuenta | gris (`slate`) | "No abrió", desactivación, dentro de la tolerancia, Otro |
| Distinguir (tipos de venta, medios, turnos, acciones) | violeta (`violet`), rojo (`rose`) y naranja (`orange`) | Local, Pedidos Ya, efectivo, débito, Mediodía, Noche |
| Resultado | azul (`blue`) | Balance, Ganancia |
| Cambió, editado, aviso de estado | azul (`blue`) | "Editada", "Pendiente", postergado |

**El ámbar no se usa en la app, y el amarillo solo para el Mediodía** (Santiago, 2026-11-21: no le gustan). La única
excepción es **Vender**, que conserva sus colores, y la medalla de oro de Más vendidos. Un sobrante
fuera de la tolerancia es una alerta como un faltante: va en rojo.

- **Prohibidos en el panel**: índigo, púrpura, celeste, rosa chicle y dorado (el violeta se permite
  para distinguir desde el 2026-11-21)
  (`tests/regla-de-color.test.ts` y `tests/panel-tema.test.ts` lo controlan). En gráficos vale la
  paleta de `dataviz` con estos mismos significados.

## Las piezas

### 1. Encabezado de pantalla

`Pantalla` (`src/components/panel/Pantalla.tsx`): título grande en `font-display`, subtítulo gris
de una línea, acciones a la derecha y el ícono de ayuda (ⓘ) al final. Las acciones son píldoras
de `estilos.ts`:

- La principal de plata o de vender: `ACCESO_VERDE` con su ícono en `ICONO_DE_ACCESO_SOBRE_VERDE`.
- La principal de otra cosa: `ACCESO_PRINCIPAL` (tinta).
- Las secundarias: `ACCESO_SECUNDARIO` (blanca con borde) con el ícono en `ICONO_DE_ACCESO_SUAVE`.
- La de peligro: `ACCESO_DE_PELIGRO`.
- **Cancelar, eliminar, anular, desactivar y todo lo que deshace o borra va en rojo** (Santiago,
  2026-11-21): `BOTON_CANCELAR` (rojo suave), `BOTON_PELIGRO` (rojo lleno), `ICONO_BORRAR` (tacho
  rojo). Lo que solo vuelve o suma ("Atrás", "Agregar renglón") **no** es rojo: `BOTON_SUAVE`.
- La sombra de toda tarjeta es `shadow-card`, que en `panel.css` es la sombra de Inicio. No se
  escribe una sombra a mano.
- Lo que casi no se toca va junto detrás de **un solo** botón secundario que abre una `Ventana`
  (ejemplo: `AjustesDeCaja`).

### 2. Filtros

Una sola tarjeta blanca redondeada a lo ancho: `BarraAutomatica` (cada cambio filtra solo, sin
botón) o `BarraDeFiltros` con `BotonDeFiltrar`. Adentro, `FiltroDeFecha` (Desde/Hasta con
etiqueta chica en mayúsculas) y `FiltroDeSeleccion` (desplegables sin etiqueta visible, con el
nombre como opción vacía: "Medio de pago", "Empleado"). **No se agregan atajos** como Hoy/Semana/
Mes: Santiago los probó y los sacó.

### 3. Tarjetas de número (las de arriba)

El modelo es `src/components/inicio/TarjetasDelMes.tsx` y su copia en
`src/app/admin/(panel)/ventas/TarjetasDeVentas.tsx`. Estructura, siempre igual:

```
┌───────────────────────────────────────┐  borde teñido: colorDeTarjeta(etiqueta).borde
│ ETIQUETA (10px, mayúsculas, slate-500) [ícono]│  ícono en cuadrado: .icono + borde
│ $108.900,00 (font-display, 2xl–3xl)          │
│ ayuda opcional (11px, muted)                 │
│ ───────────────────────────────────────────  │  border-t border-slate-100
│ DETALLE (9px, mayúsculas, slate-400)       ● │  punto: colorDeTarjeta(etiqueta).punto
└───────────────────────────────────────┘
```

- Clase de la tarjeta: `relative flex flex-col overflow-hidden rounded-xl border ${borde} bg-white
  p-4 md:p-6 ${SOMBRA_DE_INICIO}`; el pie va en `mt-auto pt-4` para que todas midan lo mismo.
- `SOMBRA_DE_INICIO` sale de `src/components/inicio/sombraDeInicio.ts`.
- El color de cada etiqueta se agrega en `src/lib/inicio/coloresDeTarjetas.ts` (con su test), no
  en la pantalla.
- Grilla: `grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-3 md:gap-4` (o `xl:grid-cols-4` si son
  cuatro).
- El número grande va **sin** decimales cuando son millones en un resumen (Inicio) y **con**
  decimales en el detalle de un período (Ventas): se respeta lo que ya usa cada pantalla.

### 4. Tarjetas de bloque (gráficos, rankings, listas cortas)

Modelo: `MesAMes`, `MasVendidos`, `SemanaContraSemana`, `GastosEnTorta` de `src/components/inicio`.

- Caja: `h-full flex flex-col rounded-2xl border border-border bg-card p-6 md:p-8
  ${SOMBRA_DE_INICIO}`.
- Encabezado: `EncabezadoDeTarjeta` (título `font-display` extra negrita, una línea gris debajo
  que dice qué muestra) con el botón píldora a la derecha: `BOTON_DE_TARJETA` + la flecha en
  `CIRCULO_DE_BOTON` ("Ver todo el año ↗", "Ver costos ↗").
- Una tarjeta oscura destacada (`bg-foreground`, letra blanca) solo para **el** número principal
  de la pantalla, como "Ventas del mes" en Inicio. Una por pantalla, como mucho.
- Gráficos: Recharts con la skill `dataviz`, grilla y ejes apagados, leyenda abajo con puntos.

### 5. Tablas

`ListaDelPanel` (`src/components/panel/ListaDelPanel.tsx`): tarjeta blanca con encabezado (ícono
de color + nombre en mayúsculas grises) y el contador "N RESULTADOS" en píldora gris a la derecha;
títulos de columna en `TITULO_DE_COLUMNA`; en el celular, tarjetas.

- **Columnas alineadas de verdad**: si una columna se centra, su contenido va en un bloque de
  **ancho fijo** centrado y alineado a la izquierda (`xl:mx-auto xl:w-56`, `xl:w-72`), así todas
  las filas arrancan en el mismo lugar aunque una tenga una etiqueta de más (pedido de Santiago en
  Control de cierres).
- Fecha arriba y hora gris abajo; montos a la derecha en `tabular-nums` negrita.
- Lo que no aplica a una fila va como "—" gris, no vacío.
- Filas de otro tipo (un día que el local no abrió) van **dentro** de la lista, en su orden, en
  gris, no en un recuadro aparte.

### 6. Insignias y estados

`InsigniaDeEstado` con tono (`esmeralda`, `rosa`, `ambar`, `pizarra`) y su ícono: píldora chica en
mayúsculas ("CERRADA", "EDITADA", "NO ABRIÓ"). Se pueden poner dos juntas. Los montos de una
diferencia siguen la tabla de colores (rojo falta, ámbar sobra, gris dentro de la tolerancia).

### 7. Avisos y recuadros

- Un aviso que pide acción va en rojo suave (`border-rose-300 bg-rose-50 text-rose-900`) con
  `AlertTriangle` rosa y, si despliega, `details` con la lista adentro en blanco.
- Un aviso de estado o postergación, ámbar suave.
- Un aviso eliminable lleva tacho (`Trash2`) y pregunta "¿Seguro…?" en la misma fila, nunca con
  `confirm()` del navegador.

### 8. Ventanas

`Ventana` (`src/components/panel/Ventana.tsx`): blanca, redondeada, con el fondo desenfocado. Por
dentro, cada parte en una tarjeta blanca con su ícono de color (modelo: `SeccionDeAjustes` en
`caja/control`), la ayuda en letra chica debajo de los campos y **un solo** botón para guardar
todo, a lo ancho, al pie.

## Cómo se pasa una pantalla a esta estética

1. Mirá la pantalla en `npm run dev` y compará con Ventas e Inicio.
2. Recorré las piezas de arriba en orden: encabezado, filtros, números, bloques, tabla,
   insignias, avisos, ventanas. Cambiá **solo el aspecto**: textos, datos, rutas y comportamiento
   quedan (si algo de eso hace falta cambiarlo, se pregunta).
3. Primero el test (TDD de `CLAUDE.md`): si la pieza tiene lógica (un color por etiqueta, una
   alineación por estado), va a un `.ts` con su test; si es solo forma, un test que lea el archivo
   y compruebe la pieza usada (modelo: `tests/ingreso-dorado.test.ts`,
   `src/app/admin/(panel)/caja/control/ajustes.test.ts`).
4. `npx vitest run --project puros`, `npx tsc --noEmit` y `npm run lint`. Las pruebas de color del
   panel tienen que seguir pasando.
5. Verlo en pantalla en los dos tamaños (escritorio y celular) antes de decir que está.

## Lo que no se hace

- No se usa `design-taste-frontend` ni `minimalist-ui` (imponen su paleta), ni `impeccable` salvo
  que Santiago lo pida.
- No se instalan componentes con el CLI de shadcn.
- No se agregan colores fuera de la tabla ni dorado.
- No se pone una tarjeta dentro de otra tarjeta con el mismo borde y sombra: adentro, `MOSAICO`
  o `bg-secondary/40`.
- No se cambia Inicio, Ingresar, Crear cuenta ni Cambiar contraseña con esta skill.
