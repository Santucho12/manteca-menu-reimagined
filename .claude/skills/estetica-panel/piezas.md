# Piezas del panel, con sus clases exactas

Cada pieza sale de un archivo de Plan Reminder Pro (PRP), citado al lado del título. Las clases
ya están pasadas a Tailwind 4 (`shadow-xs` donde PRP dice `shadow-sm`, `backdrop-blur-xs`
donde dice `backdrop-blur-sm`, `outline-hidden` donde dice `outline-none`): se copian tal cual.
Las animaciones de cada pieza están en `movimiento.md`. Las capturas de `referencias/`
muestran cómo se ve cada una.

Lo marcado **(extensión)** no existe en PRP: Manteca lo necesita y se armó con piezas de PRP.

## Índice

1. Marco: raíz, barra lateral, barras del celular, "Más"
2. Encabezado de pantalla y título de sección
3. Tarjetas: números, bloque oscuro, paneles chicos, tarjeta de sección, panel de lista
4. Tabla y su versión en tarjetas
5. Insignias, pastillas y chips
6. Filtros, pestañas y control segmentado
7. Formularios
8. Botones
9. Ventanas: modal, confirmación, hoja lateral, ayuda
10. Avisos, notas, vacíos y éxito
11. Ingreso (login)
12. Cómo se arma cada tipo de pantalla de Manteca

---

## 1. Marco

### Raíz y contenido (`src/pages/Index.tsx`)

```tsx
<div className="min-h-screen bg-background">
  {/* barra lateral y barras del celular */}
  <main className="lg:ml-[260px] px-4 md:px-8 pt-20 pb-28 lg:p-10 min-h-screen relative overflow-clip">
    <div className="max-w-7xl mx-auto">{/* encabezado y pantalla */}</div>
  </main>
</div>
```

- `pt-20` y `pb-28` dejan lugar a las barras fijas del celular; desde `lg` todo es `p-10`.
- El `<Toaster />` va **dentro** de `<main>` (ver Avisos).
- PRP tiene en `main` (y en el ingreso) dos manchas de color difuminadas con `-z-10`, pero **no se
  ven**: quedan detrás del fondo de `div.bg-background`. No se agregan. Si se agregaran con otra
  estructura (otro contenedor, un `isolate`, un `z-index`), aparecerían, y ya no sería PRP.

### Barra lateral, desde `lg` (`src/components/AppSidebar.tsx`)

PRP elige entre barra lateral y barras del celular con JavaScript (`useIsMobile`, 1024 px). En
Next se dibujan las dos y las alterna el CSS: `hidden lg:flex` en la lateral y `lg:hidden` en
las del celular. Se ve igual y no parpadea al cargar.

```tsx
<aside className="fixed left-0 top-0 h-full w-[260px] border-r border-border bg-card hidden lg:flex flex-col z-50">
  <div className="p-8 pb-6">
    <div role="img" aria-label="Manteca" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
        <Croissant className="text-white" size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-2xl font-display font-extrabold tracking-tight leading-none">Manteca</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap mt-1">
          Sistema de gestión
        </p>
      </div>
    </div>
  </div>

  <nav aria-label="Panel" className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto">
    {/* un EnlaceDelPanel por sección */}
  </nav>

  <div className="p-4 space-y-4">
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-secondary/40">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">P</span>
      <p className="min-w-0 truncate text-sm font-semibold">Prueba Admin</p>
    </div>
    <form action="/admin/salir" method="post">
      <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300">
        <LogOut size={20} />
        Salir
      </button>
    </form>
  </div>
</aside>
```

- PRP dice "Cerrar sesión"; en Manteca dice **"Salir"**, que es lo que buscan las pruebas
  (`e2e/acceso.spec.ts`, `e2e/cuenta.spec.ts`).
- Quién tiene la sesión **(extensión)**: las pruebas piden ver el nombre. Va arriba de Salir, con
  el círculo de la inicial de las tablas de PRP y el fondo de sus mosaicos de datos.

- Marca (decisión de Santiago, 2026-10-21): cuadrado verde con la medialuna de lucide
  (`Croissant`) y "Manteca". PRP usa su rayo relleno (`fill-white`); la medialuna rellena queda
  como una mancha, así que va con trazo de 2,5, que pesa parecido. El nombre va en un `<p>` con
  `font-display`: el único `h1` de la página es el título de la pantalla. `role="img"` y
  `aria-label="Manteca"` son los que busca `e2e/sidebar.spec.ts`.
- `overflow-y-auto` en el `nav` **(extensión)**: PRP tiene 5 secciones; Manteca tiene 10 y en
  una pantalla baja no entran.

Enlace de sección (en PRP es un `button`; en Manteca, `Link` con `aria-current`):

```tsx
<Link
  href={enlace.href}
  aria-current={activo ? 'page' : undefined}
  className={cn(
    'relative group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300',
    activo
      ? 'text-primary shadow-xs ring-1 ring-primary/20'
      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
  )}
>
  <Icono size={20} strokeWidth={activo ? 2.5 : 2} />
  <span className="relative z-10">{enlace.texto}</span>
  {enlace.insignia && (
    <span className="relative z-10 ml-auto px-2 py-0.5 rounded-full bg-secondary text-[10px] font-black">
      {enlace.insignia}
    </span>
  )}
  {activo && (
    <motion.div
      layoutId="activeNav"
      className="absolute inset-0 bg-primary/10 rounded-2xl z-0"
      initial={false}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />
  )}
</Link>
```

- El orden de los hijos importa: el fondo verde (`motion.div`) va último y queda por encima del
  ícono (por eso el ícono activo se ve apenas teñido) y por debajo del texto (`z-10`).
- Insignia **(extensión)**: el número de pendientes de `enlacesDelMarco` (`src/lib/acceso/marco.ts`),
  con el contador de las pestañas de PRP (`MessagesView.tsx`) empujado a la derecha.
- Íconos de lucide por sección (PRP no tiene estas secciones: los eligió Claude y Santiago los
  puede cambiar): Inicio `LayoutDashboard`,
  Menú `BookOpen`, Ventas `ShoppingBag`, Proveedores `Truck`, Gastos `Receipt`, Caja `Wallet`,
  Reportes `ChartColumn`, Usuarios `Users`, Auditoría `History`, Mi cuenta `UserCog`; para el
  rol caja, Cargar cierre `Wallet` y Mis cierres `ListChecks`.

### Barras del celular, por debajo de `lg` (`AppSidebar.tsx`)

```tsx
<header className="lg:hidden fixed top-0 inset-x-0 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] z-50 bg-card/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
  <div role="img" aria-label="Manteca" className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
      <Croissant className="text-white" size={18} strokeWidth={2.5} />
    </div>
    <p className="text-lg font-display font-extrabold tracking-tight leading-none">Manteca</p>
  </div>
  <div className="flex items-center gap-1 min-w-0">
    <span className="truncate max-w-[45vw] text-xs font-semibold text-muted-foreground">Prueba Admin</span>
    <form action="/admin/salir" method="post">
      <button aria-label="Salir" className="h-9 w-9 rounded-xl text-muted-foreground flex items-center justify-center">
        <LogOut size={18} />
      </button>
    </form>
  </div>
</header>

<nav aria-label="Panel" className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur border-t border-border flex pb-[env(safe-area-inset-bottom)]">
  {abajo.map((enlace) => (
    <Link
      key={enlace.clave}
      href={enlace.href}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'flex-1 min-w-0 h-16 flex flex-col items-center justify-center gap-1 text-[9px] font-bold transition-colors',
        activo ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <span className="relative">
        <Icono size={20} strokeWidth={activo ? 2.5 : 2} />
        {/* insignia del celular, abajo */}
      </span>
      <span className="truncate max-w-full px-0.5">{enlace.texto}</span>
    </Link>
  ))}
  {/* el botón "Más", si hay más de 5 enlaces */}
</nav>
```

- Qué va abajo lo decide `repartirParaCelular` (`src/lib/acceso/navegacion.ts`): con 5 enlaces o
  menos van todos (como PRP); con más, Inicio, Ventas, Gastos y Caja, y el quinto lugar es "Más".
- `backdrop-blur` sin sufijo es 8 px en las dos versiones de Tailwind: queda igual.

Insignia sobre el ícono **(extensión)**, dentro del `span relative`; el número va antes del
nombre ("3 Gastos"), como esperan las pruebas:

```tsx
<span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-secondary text-foreground text-[9px] font-black leading-4 text-center ring-2 ring-card">
  {insignia}
</span>
```

### "Más" en el celular **(extensión)**

El quinto lugar de la barra de abajo es un botón con la misma forma que los enlaces, ícono
`Ellipsis` y texto "Más" (con la suma de las insignias de lo que tiene adentro: `insigniaDeMas`).
Abre una hoja desde abajo con la forma de las ventanas de PRP en el celular:

```tsx
<div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in-fade lg:hidden" onClick={cerrar}>
  <motion.div /* entra como las ventanas: ver movimiento.md */ onClick={(e) => e.stopPropagation()}
    className="bg-card w-full rounded-t-3xl shadow-2xl border border-border overflow-hidden max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
      <h2 className="text-xl font-bold tracking-tight">Más secciones</h2>
      <button type="button" aria-label="Cerrar" onClick={cerrar} className="p-2 rounded-full hover:bg-secondary transition-colors">
        <X size={20} />
      </button>
    </div>
    <nav aria-label="Más secciones" className="p-4 space-y-1">
      {/* los enlaces de "mas", con la forma del enlace de la barra lateral */}
    </nav>
  </motion.div>
</div>
```

## 2. Encabezado de pantalla y título de sección

### Encabezado (`Index.tsx`)

```tsx
<header className="mb-6 md:mb-10 flex items-start gap-3">
  <motion.div /* entra desde la izquierda: movimiento.md */ className="flex-1 min-w-0">
    <h1 className="text-2xl md:text-4xl font-display font-extrabold tracking-tight">Proveedores</h1>
    <p className="text-sm md:text-base text-muted-foreground font-medium mt-1 md:mt-2">
      Una línea que dice para qué es la pantalla.
    </p>
  </motion.div>
  <BotonDeAyuda />
</header>
```

Con botones de acción, el bloque del título pasa a ser:

```tsx
<motion.div className="flex-1 min-w-0">
  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
    <div>{/* h1 y subtítulo */}</div>
    <div className="flex items-center gap-3">
      <button className="flex-1 lg:flex-none px-4 md:px-6 h-11 md:h-12 rounded-2xl bg-emerald-600 text-white font-bold text-sm md:uppercase md:tracking-widest whitespace-nowrap shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3">
        <FileSpreadsheet size={18} /> Exportar Excel
      </button>
      <button className="flex-1 lg:flex-none px-4 md:px-6 h-11 md:h-12 rounded-2xl bg-primary text-white font-bold text-sm md:uppercase md:tracking-widest whitespace-nowrap shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3">
        <UserPlus size={18} /> Nuevo proveedor
      </button>
    </div>
  </div>
</motion.div>
```

- En PRP el título es `h2` (el `h1` es la marca); en Manteca es `h1`, con las mismas clases.
- Cada pantalla principal tiene subtítulo y botón de ayuda ⓘ (ver Ventanas → Ayuda).
- El botón verde oscuro (`bg-emerald-600`) es la acción secundaria; el principal, `bg-primary`.

### Título de sección (`Index.tsx`, `ConfigView.tsx`)

```tsx
<section className="space-y-6">
  <div className="flex items-center gap-3 px-1">
    <div className="w-1 h-6 bg-primary rounded-full" />
    <h2 className="text-xl font-bold tracking-tight text-slate-800">Datos de cobro</h2>
  </div>
  {/* tarjeta */}
</section>
```

Entre secciones: `space-y-10` (pantallas de varias secciones) o `space-y-8`.

## 3. Tarjetas

### Tarjetas de números (`SummaryCards.tsx`)

```tsx
<motion.div /* contenedor escalonado: movimiento.md */ className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
  <motion.div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-white p-4 md:p-6 flex flex-col shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
    <div className="flex justify-between items-start gap-2 relative z-10">
      <div className="space-y-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Activos</p>
        <div className="flex items-center gap-2">
          <h3 className="text-3xl font-bold tracking-tight text-slate-900">14</h3>
        </div>
      </div>
      <div className="shrink-0 rounded-lg p-1.5 md:p-2 bg-emerald-50 text-emerald-600 border border-emerald-100">
        <Users size={18} />
      </div>
    </div>
    <div className="mt-auto pt-4">
      <div className="pt-3 md:pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold text-slate-400 uppercase leading-snug">Con el plan vigente</span>
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
      </div>
    </div>
  </motion.div>
</motion.div>
```

| Tono | Borde de la tarjeta y del ícono | Fondo del ícono | Ícono | Punto | Uso en PRP |
|---|---|---|---|---|---|
| esmeralda | `border-emerald-100` | `bg-emerald-50` | `text-emerald-600` | `bg-emerald-600` | lo que está bien |
| rosa | `border-rose-100` | `bg-rose-50` | `text-rose-600` | `bg-rose-600` | lo urgente de hoy |
| ámbar | `border-amber-100` | `bg-amber-50` | `text-amber-600` | `bg-amber-600` | lo que se viene |
| pizarra | `border-slate-100` | `bg-slate-50` | `text-slate-600` | `bg-slate-600` | lo vencido o neutro |

El número es un `h3`: por eso sale en Outfit. Un `p` común sale en Inter; si no se quiere un
título ahí, va `<p className="font-display text-3xl font-bold tracking-tight text-slate-900">`,
que se ve igual. Lo mismo vale para cualquier `h1`–`h4` de PRP.

### Bloque oscuro del mes (`SummaryCards.tsx`)

```tsx
<motion.div /* sube 20 px en 0,5 s: movimiento.md */ className="relative overflow-hidden rounded-2xl bg-[#0F172A] border border-slate-800 shadow-2xl p-5 md:p-8">
  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <TrendingUp size={16} />
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Cobranza del mes</p>
      </div>
      <div className="space-y-1">
        <p className="text-slate-500 text-sm font-medium">Cobrado este mes · 8 pagos registrados</p>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white font-display">$41.200</h2>
          <div className="flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-md text-emerald-400 bg-emerald-400/10">
            <ArrowUpRight size={14} /><span>+12% vs. mes anterior</span>
          </div>
        </div>
      </div>
    </div>

    <div className="w-full md:w-80 space-y-4 p-5 rounded-xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xs">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Por cobrar</p>
          <p className="text-white font-bold text-xl">$41.100</p>
        </div>
        {/* segundo dato igual */}
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
          <span className="text-slate-500 tracking-tighter">Eficiencia de cobro</span>
          <span className="text-emerald-400">50%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
          <motion.div /* ancho de 0 al valor en 1,5 s */ className="h-full bg-linear-to-r/srgb from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">Cómo se calcula, en una línea.</p>
      </div>
    </div>
  </div>

  <div className="absolute top-0 right-0 h-full w-1/3 bg-linear-to-l/srgb from-emerald-500/5 to-transparent pointer-events-none" />
  <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
  <div className="absolute top-0 right-0 p-4 opacity-5">
    <Wallet size={120} strokeWidth={0.5} />
  </div>
</motion.div>
```

Si baja contra el mes anterior: `text-rose-400 bg-rose-400/10` y `ArrowDownRight`.

### Paneles chicos (`SummaryCards.tsx`)

Van de a tres: `grid grid-cols-1 xl:grid-cols-3 gap-4`. Cada uno:

```tsx
<div className="rounded-2xl border border-border bg-card p-5 md:p-6">
  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Cobrado últimos 6 meses</p>
  {/* contenido */}
</div>
```

Barras por mes (hechas con `div`, sin librería de gráficos):

```tsx
<div className="flex items-end gap-2 h-32">
  {meses.map((mes, i) => (
    <div key={mes.etiqueta} className="flex-1 flex flex-col items-center gap-2 h-full justify-end" title={plata(mes.total)}>
      <div
        className={`w-full rounded-t-md ${i === meses.length - 1 ? 'bg-primary' : 'bg-primary/25'}`}
        style={{ height: `${Math.max((mes.total / maximo) * 100, 2)}%` }}
      />
      <span className="text-[10px] font-bold text-slate-400 uppercase">{mes.etiqueta}</span>
    </div>
  ))}
</div>
```

Ranking con barra de avance:

```tsx
<ul className="space-y-3">
  <li className="space-y-1">
    <div className="flex justify-between gap-3 text-xs font-semibold">
      <span className="truncate">Netflix 4K <span className="text-muted-foreground font-medium">· 3</span></span>
      <span className="shrink-0">$19.500</span>
    </div>
    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
      <div className="h-full rounded-full bg-emerald-500" style={{ width: '82%' }} />
    </div>
  </li>
</ul>
```

Últimos movimientos:

```tsx
<ul className="divide-y divide-border">
  <li className="py-2 flex items-center gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold truncate">Valentina López</p>
      <p className="text-[10px] text-muted-foreground truncate">16/10 · Efectivo</p>
    </div>
    <span className="text-xs font-bold">$9.600</span>
    <button type="button" title="Deshacer pago" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
      <Undo2 size={14} />
    </button>
  </li>
</ul>
```

Sin datos, adentro del panel: `<p className="text-sm text-muted-foreground leading-relaxed">`.

Con Recharts (Reportes) **(extensión)**: sin grilla ni líneas de ejes; textos de los ejes en
`10px`, `700`, mayúsculas, `#94a3b8` (slate-400); barras `hsl(160 84% 39%)` con la última llena
y las demás al 25 %, radio `[10, 10, 0, 0]` (el `rounded-t-md` de PRP); el globo, oscuro como el
de las notas (sección 10). Colores de series solo de la paleta de PRP.

### Tarjeta de sección (`PlansView.tsx`, `ConfigView.tsx`)

La tarjeta grande de las pantallas de catálogo y de formulario:

```tsx
<div className="bg-card rounded-[2rem] border border-border/60 shadow-xl p-5 md:p-8 space-y-6">
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
      <Layers className="text-primary" size={24} />
    </div>
    <div>
      <h3 className="text-lg font-bold tracking-tight">Catálogo de plataformas</h3>
      <p className="text-xs text-muted-foreground">Qué se hace acá, en una línea.</p>
    </div>
  </div>
  {/* filas, formulario o botones */}
</div>
```

- Catálogos y listas: `border-border/60`. Formularios (Configuración): `border-border/50`.
- Variante violeta (lo secundario, como los combos): `bg-violet-500/10 border-violet-500/20` y
  el ícono `text-violet-600`.
- Con texto largo al lado del ícono: `flex items-start gap-3`, ícono `shrink-0` y texto
  `text-sm text-muted-foreground leading-relaxed`.

Filas de la tarjeta:

```tsx
<ul className="divide-y divide-border border-y border-border">
  <li className="py-3 flex items-center gap-2 sm:gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold break-words">Disney+</p>
      <p className="text-xs text-muted-foreground">
        3 clientes<span className="text-amber-600 font-semibold"> · 1 con otro precio</span>
      </p>
    </div>
    <span className="shrink-0 sm:min-w-[96px] text-right text-sm sm:text-base font-bold tabular-nums">$4.800</span>
    <div className="flex items-center shrink-0 -mr-2">
      <button type="button" aria-label="Editar Disney+" className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors">
        <Pencil size={16} />
      </button>
      <button type="button" aria-label="Quitar Disney+" className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400">
        <Trash2 size={16} />
      </button>
    </div>
  </li>
</ul>
```

Dentro del texto: lo que pide atención en `text-amber-600 font-semibold`; lo bueno en
`text-emerald-600 font-semibold`.

### Panel de lista con cabecera (`MessagesView.tsx`)

```tsx
<div className="bg-card rounded-3xl md:rounded-[2rem] border border-border/60 shadow-xl overflow-hidden">
  <div className="px-4 md:px-6 py-4 md:py-5 border-b border-border bg-secondary/20 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <h2 className="text-sm md:text-base font-bold tracking-tight uppercase text-muted-foreground/80">Clientes a contactar</h2>
      <span className="px-2 py-1 bg-secondary rounded-md text-[10px] md:text-xs font-semibold tracking-widest text-muted-foreground uppercase whitespace-nowrap">3 clientes</span>
    </div>
    {/* casilla y botón a la derecha */}
  </div>
  <ul className="divide-y divide-border">
    <li className="px-4 md:px-5 py-3 sm:py-2.5 flex items-center gap-2.5 md:gap-3 hover:bg-secondary/40 transition-colors">
      <div className="w-7 h-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[11px] uppercase">L</div>
      <div className="flex-1 min-w-[7rem]">
        <p className="text-sm font-semibold truncate">Lucía Fernández</p>
        <p className="text-[11px] text-muted-foreground truncate"><span className="font-mono">5491155550110</span> · Netflix 4K</p>
      </div>
      <span className="hidden sm:block text-sm font-bold tabular-nums">$6.500</span>
      {/* botones chicos (sección 8) */}
    </li>
  </ul>
</div>
```

Vacío: `<p className="p-12 text-center text-sm text-muted-foreground font-medium">`.

Tarjeta de explicación con punto (columna izquierda de Mensajes):

```tsx
<div className="bg-card rounded-3xl md:rounded-[2rem] border border-border/60 shadow-xl p-5 md:p-8 space-y-5 md:space-y-6">
  <div className="space-y-2">
    <h4 className="text-[13px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-primary" />Vencen hoy
    </h4>
    <p className="text-[11px] text-muted-foreground leading-relaxed">Explicación corta.</p>
  </div>
</div>
```

Dos columnas: `grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-8`, la explicación `xl:col-span-1`
(`order-2 xl:order-none`) y la lista `xl:col-span-2` (`order-1 xl:order-none`).

## 4. Tabla y su versión en tarjetas (`ClientTable.tsx`)

Desde `xl` (1280 px) va la tabla; por debajo, tarjetas. PRP decide con `useIsMobile(1280)`;
en Next, `hidden xl:block` y `xl:hidden`.

```tsx
<div className="bg-card rounded-2xl shadow-premium border border-border overflow-hidden animate-in-slide">
  <div className="px-6 py-5 border-b border-border bg-secondary/20 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Activity size={18} className="text-primary" />
      <h2 className="text-base font-bold tracking-tight uppercase text-muted-foreground/80">Clientes</h2>
    </div>
    <div className="flex items-center gap-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
      <span className="px-2 py-1 bg-secondary rounded-md">20 Resultados</span>
    </div>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-border bg-muted/30">
          <th className="text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-2"><User size={12} /> Cliente</div>
          </th>
          <th className="hidden lg:table-cell text-left py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Plataforma</th>
          <th className="text-right py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center justify-end gap-2"><DollarSign size={12} /> Total</div>
          </th>
          <th className="text-center py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado</th>
          <th className="text-right py-3 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        <motion.tr /* aparece: movimiento.md */ className="group hover:bg-secondary/40 transition-all duration-200">
          <td className="px-3 py-2.5">{/* celda de nombre */}</td>
        </motion.tr>
      </tbody>
    </table>
  </div>
</div>
```

**Cuando la prueba de la pantalla busca una lista** (`getByRole('list', { name })` y
`getByRole('listitem')`, como en Gastos, Proveedores, Caja y Auditoría), la tabla queda igual y se
le cambian solo los roles. Se ve idéntica a PRP y la prueba encuentra su lista:

```tsx
<table role="presentation" className="w-full border-collapse">
  <thead aria-hidden="true">{/* igual */}</thead>
  <tbody role="list" aria-label="Proveedores" className="divide-y divide-border">
    <motion.tr role="listitem" className="group hover:bg-secondary/40 transition-all duration-200">
      <td className="px-3 py-2.5 text-right">
        <span className="sr-only">Pagado este mes: </span>
        <span className="text-sm font-bold text-foreground whitespace-nowrap">$3.000,00</span>
      </td>
    </motion.tr>
  </tbody>
</table>
```

Los títulos de columna quedan escondidos para el lector de pantalla; cada celda que la prueba lee
como "Etiqueta: valor" lleva su etiqueta en `sr-only`. Donde la prueba pide una tabla
(`getByRole('table', { name })`, como "Cambios de precio" en Menú), va la tabla común con
`aria-label`.

Celdas (todas `px-3 py-2.5`):

| Celda | Clases |
|---|---|
| Avatar | `w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-xs` con la inicial; al lado, en `flex items-center gap-3` |
| Nombre (abre la ficha) | botón `text-xs font-semibold text-foreground line-clamp-2 max-w-[160px] break-words whitespace-normal text-left hover:text-primary rounded focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors` |
| Dato en código | `text-xs font-mono font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md`; si falta, `text-xs text-muted-foreground/70 italic` |
| Texto común | `text-xs font-medium text-foreground/80` (`line-clamp-2 break-words` si es largo; la celda `max-w-[170px] align-middle`) |
| Fecha | `text-xs font-medium text-foreground/80 whitespace-nowrap`, formato "21 oct 26" |
| Número en círculo | `inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold` + color de pastilla (sección 5) |
| Monto | `text-right`; `text-sm font-bold text-foreground whitespace-nowrap` |
| Estado | `text-center`; la insignia de estado |
| Acciones | `flex items-center justify-end gap-1` con los botones chicos de la sección 8 |

Columnas que se esconden: `hidden lg:table-cell` y `hidden min-[1440px]:table-cell`.

Nota al lado de un dato (globito con globo oscuro al pasar el mouse):

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-primary cursor-pointer hover:bg-primary hover:text-white transition-all hover:scale-110 shadow-xs border border-primary/20">
      <MessageSquare size={10} fill="currentColor" fillOpacity={0.2} />
    </div>
  </TooltipTrigger>
  <TooltipContent side="top" className="max-w-xs bg-slate-900 text-white border-none shadow-2xl rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Nota plataforma</span>
      <p className="text-xs font-semibold leading-relaxed">El texto de la nota.</p>
    </div>
  </TooltipContent>
</Tooltip>
```

Variante ámbar (nota de precio): `bg-amber-100 text-amber-600 hover:bg-amber-500 border-amber-200`
y el título del globo `text-amber-400`.

Tarjetas por debajo de `xl` (si la prueba busca una lista, el contenedor es
`<ul aria-label="..." className="grid ...">` y cada tarjeta un `<li>` en vez de `<article>`):

```tsx
<div className="space-y-3">
  <p className="px-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">20 Resultados</p>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <article className="bg-card rounded-2xl border border-border shadow-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">S</div>
          <div className="min-w-0">
            <p className="block max-w-full text-sm font-bold truncate">Sofía Ramírez</p>
            <p className="text-xs text-muted-foreground truncate">Netflix 4K + Disney+</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">$9.800</p>
          {/* insignia de estado */}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Vence 21 oct 2026</span>
        <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full font-bold bg-rose-100 text-rose-600 animate-pulse-subtle">0 d</span>
      </div>
      <div className="flex items-center gap-1.5 min-[380px]:gap-2">
        <button className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 h-11 px-2 rounded-xl text-[13px] min-[380px]:text-sm font-bold bg-primary text-white active:scale-95 transition-all">
          <Send size={15} /> WhatsApp
        </button>
        <button className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 h-11 px-2 rounded-xl text-[13px] min-[380px]:text-sm font-bold bg-emerald-600 text-white active:scale-95 transition-all">
          <HandCoins size={16} /> Pagó
        </button>
        <button aria-label="Editar" className="h-11 w-10 min-[380px]:w-11 shrink-0 rounded-xl bg-secondary text-slate-500 flex items-center justify-center">
          <Pencil size={16} />
        </button>
      </div>
    </article>
  </div>
</div>
```

Sin resultados (va en lugar de la tabla y de las tarjetas):

```tsx
<motion.div /* aparece con escala: movimiento.md */ className="bg-card rounded-2xl shadow-card border border-border p-10 md:p-16 text-center flex flex-col items-center gap-4">
  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
    <Croissant size={32} />
  </div>
  <div>
    <h3 className="text-lg font-semibold">No se encontraron proveedores</h3>
    <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1">
      No hay registros que coincidan con tu búsqueda o tus filtros.
    </p>
  </div>
</motion.div>
```

PRP pone acá el ícono de su marca (el rayo); en Manteca, la medialuna.

## 5. Insignias, pastillas y chips

Insignia de estado (`StatusBadge.tsx`):

```tsx
<span className={cn(
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all duration-300 shadow-xs',
  tono,
)}>
  <Icono size={12} strokeWidth={2.5} />
  Vence hoy
</span>
```

| Tono | Clases | Ícono | Uso en PRP |
|---|---|---|---|
| rosa, late | `bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse-subtle` | `AlertCircle` | urgente hoy |
| ámbar | `bg-amber-500/10 text-amber-600 border-amber-500/20` | `Clock` | por vencer, pendiente |
| esmeralda | `bg-emerald-500/10 text-emerald-600 border-emerald-500/20` | `CheckCircle2` | activo, al día |
| pizarra | `bg-slate-500/10 text-slate-500 border-slate-500/20` | `Ban` | vencido, inactivo, anulado |
| sin estado | `bg-slate-500/10 text-slate-600 border-slate-500/20` | `Ban` | lo demás |

Pastilla de número (días): negativo `bg-slate-100 text-slate-500`; cero
`bg-rose-100 text-rose-600 animate-pulse-subtle`; 1 a 3 `bg-amber-100 text-amber-600`; más
`bg-emerald-100 text-emerald-600`.

Chip violeta bajo un nombre: `inline-block mt-1 px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[9px] font-bold uppercase tracking-wider`.

Chip de grupo: `px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold`.

Chip de dato: `px-2 py-0.5 rounded-md bg-secondary text-[11px] font-semibold text-slate-600`.

Contador: `ml-2 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-black`.

Cantidad de resultados: `px-2 py-1 bg-secondary rounded-md` dentro de un texto
`text-xs font-semibold tracking-widest text-muted-foreground uppercase`.

Señal "en vivo": `hidden md:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400`
con el punto `w-2 h-2 rounded-full bg-emerald-500`.

## 6. Filtros, pestañas y control segmentado

### Barra de filtros (`Index.tsx`)

La pantalla de lista envuelve filtros y resultados en `<div className="space-y-6">`. PRP le pone a
la tarjeta de filtros `mb-4 md:mb-8`, pero en Tailwind 3 el `space-y-6` se juntaba con ese margen
y quedaba el mayor (24 px; 32 desde `md`). En Tailwind 4 gana el del hijo: por eso acá va
`mb-6 md:mb-8`, que da lo mismo que PRP.

```tsx
<div className="flex flex-col xl:flex-row gap-3 md:gap-4 mb-6 md:mb-8 bg-card border border-border p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-xs">
  <form role="search" className="flex flex-1 gap-2 md:gap-3">
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} />
      <Input
        name="q"
        aria-label="Buscar por nombre"
        placeholder="Buscar por nombre..."
        className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl border-none bg-secondary/30 text-base font-medium focus-visible:ring-primary/20 transition-all"
      />
    </div>
    <button type="submit" className="shrink-0 px-4 md:px-6 h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary text-white font-bold text-sm md:uppercase md:tracking-widest whitespace-nowrap shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all">
      Buscar
    </button>
  </form>
  <div className="grid grid-cols-[1.3fr_1fr_1fr] sm:flex sm:flex-wrap gap-2 md:gap-3">
    <Select>
      <SelectTrigger className="w-full min-w-0 sm:w-[180px] h-11 md:h-14 px-3 md:px-4 rounded-xl md:rounded-2xl bg-secondary/30 border-none text-xs md:text-sm font-semibold [&>span]:truncate">
        <SelectValue placeholder="Categoría" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl">
        <SelectItem value="todas">Categoría</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

- `Input`, `Select*` son los componentes base de PRP (`componentes-base.md`): las clases de acá
  se suman a las suyas con `cn`.
- Botón "Buscar" **(extensión)**: PRP filtra mientras se escribe; en Manteca la lista se lee en el
  servidor y las pruebas aprietan "Buscar". Va con la forma del botón principal de encabezado, a
  la altura y el radio del buscador.
- Filtro que es un enlace **(extensión)**, como "Ver desactivados" (las pruebas lo buscan como
  enlace): la forma de los desplegables de al lado,
  `inline-flex items-center gap-2 w-full sm:w-[180px] min-w-0 h-11 md:h-14 px-3 md:px-4 rounded-xl md:rounded-2xl bg-secondary/30 hover:bg-secondary/60 text-xs md:text-sm font-semibold transition-all`;
  prendido, `bg-primary/10 text-primary ring-1 ring-primary/20`.
- La primera opción repite el nombre del filtro ("Categoría") y vale "todas".
- Orden con ícono adelante: `<ArrowUpDown className="hidden min-[380px]:block w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 shrink-0 text-muted-foreground/60" />`.
- Si un texto no entra en el celular, se muestra corto ahí (`sm:hidden`) y entero desde `sm`.

Panel extra de un filtro (rango), justo debajo:

```tsx
<section aria-label="Rango de días" className="mb-6 md:mb-8 bg-card border border-primary/30 p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-xs space-y-3">
  {/* campos chicos y atajos */}
</section>
```

PRP le pone `-mt-1 md:-mt-4 mb-4 md:mb-8`, pero dentro del `space-y-6` esos márgenes no hacían
nada en Tailwind 3: queda a 24 px (32 desde `md`) de la tarjeta de filtros y de la lista, que es lo
que da `mb-6 md:mb-8` en Tailwind 4.

### Pestañas (`Index.tsx`, `MessagesView.tsx`)

```tsx
<Tabs defaultValue="hoy" className="w-full">
  <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <TabsList className="bg-secondary/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 h-auto w-full md:w-auto">
      <TabsTrigger value="hoy" className="flex-1 md:flex-none px-3 md:px-8 py-2.5 rounded-xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg">
        <Activity className="w-4 h-4 mr-2" />
        Vencen hoy
      </TabsTrigger>
    </TabsList>
  </div>
  <TabsContent value="hoy" className="mt-0 outline-hidden animate-in-slide">{/* ... */}</TabsContent>
</Tabs>
```

Con contador y la activa en verde (Mensajes): la lista suma
`grid grid-cols-2 sm:grid-cols-4 gap-1 xl:w-max xl:flex xl:gap-0`, y cada pestaña es
`px-3 md:px-6 py-2.5 rounded-xl text-[13px] sm:text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg`,
con el ícono `w-4 h-4 mr-1.5 sm:mr-2 shrink-0` y el contador al final.

### Control segmentado (`MessagesView.tsx`)

```tsx
<div className="flex gap-1 p-1.5 mb-6 rounded-2xl bg-card border border-border w-full sm:w-fit">
  <button
    type="button"
    aria-pressed={activo}
    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
      activo ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    <Send size={16} /> Envíos
  </button>
</div>
```

## 7. Formularios

En PRP muchas etiquetas no están unidas a su campo; en Manteca siempre `htmlFor` e `id` (las
pruebas buscan con `getByLabel`). Se ve igual.

| Pieza | Clases |
|---|---|
| Campo (envoltorio) | `space-y-2` |
| Etiqueta | `text-[10px] font-black text-muted-foreground uppercase tracking-widest` |
| Etiqueta con ícono | lo mismo + `flex items-center gap-2`, ícono `size={12} className="text-primary"` |
| Campo de texto | `w-full h-12 rounded-xl bg-secondary/30 border-none px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all` |
| Campo compacto | `h-11 rounded-xl bg-secondary/40 border-none px-3 text-sm font-semibold outline-hidden focus:ring-2 focus:ring-primary/30` |
| Número, código, teléfono | el campo + `font-mono` |
| Monto | envoltorio `relative`; `$` en `absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold`; el campo con `pl-8 pr-4` y `font-bold` |
| Texto largo | `w-full min-h-[80px] rounded-xl bg-secondary/30 border-none p-4 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all resize-none` |
| Lista nativa (`select`) | las clases del campo de texto; la flecha es la del navegador |
| Fecha (`type="date"`) | las clases del campo de texto; el calendario es el del navegador |
| Ayuda bajo un campo | `text-xs text-muted-foreground` |
| Nota chica | `text-[11px] text-muted-foreground` |
| Error del formulario | `<p role="alert" className="text-sm text-rose-600 font-medium">` arriba de los botones |
| Error de un campo **(extensión)** | `<p id="..." className="text-xs text-rose-600 font-medium">` bajo el campo, y el campo con `aria-invalid` y `aria-describedby` apuntando a ese `id` (las pruebas lo leen con `toHaveAccessibleDescription`) |
| Grilla de dos | `grid grid-cols-1 sm:grid-cols-2 gap-4` |
| Formulario | `space-y-5` |

Campo con ícono adelante (ingreso):

```tsx
<div className="relative">
  <Mail size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
  <input className="w-full h-12 rounded-xl border-none bg-secondary/30 pl-10 pr-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all outline-hidden" />
</div>
```

Contraseña con ojo (`AccessSettings.tsx`): el campo con `pr-12 font-mono`, y el botón
`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors`
con `Eye` / `EyeOff` de 18 y `aria-pressed`. Solo lectura: el campo suma
`pointer-events-none select-none cursor-default focus:ring-0 focus:outline-hidden text-slate-700`.

Cantidad con − y + (`ClientDialog.tsx`):

```tsx
<div className="shrink-0 flex items-center h-12 rounded-xl bg-secondary/30" role="group" aria-label="Cantidad">
  <button type="button" aria-label="Uno menos" className="w-9 h-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
    <Minus size={14} />
  </button>
  <span className="w-6 text-center text-sm font-bold tabular-nums">1</span>
  <button type="button" aria-label="Uno más" className="w-9 h-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30">
    <Plus size={14} />
  </button>
</div>
```

Casillas: la nativa del navegador, con `rounded border-border` (no cambia cómo se ve: en Chrome
es la casilla azul). Al lado, `flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none`.

Casilla en tarjeta (`ExcelUpload.tsx`):

```tsx
<label className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${
  marcada ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30'
}`}>
  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
  <span>
    <span className="block text-sm font-bold text-foreground">Título</span>
    <span className="block text-xs text-muted-foreground mt-0.5">Explicación.</span>
  </span>
</label>
```

Agregar una fila: `h-9 px-3 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 transition-colors flex items-center gap-1.5` con `Plus` de 14.

Atajo de texto ("Según el catálogo: $X · Usar"): `text-xs font-semibold text-muted-foreground hover:text-primary transition-colors`, con la palabra de la acción en `underline`.

Opciones que se eligen tocando (`PlansView.tsx`): `px-3 h-9 text-xs font-bold border transition-colors flex items-center gap-1.5 rounded-xl`,
elegida `bg-violet-600 text-white border-violet-600` con `Check` de 12, sin elegir
`bg-white text-foreground border-border hover:border-violet-300`.

Atajos de valores (`Index.tsx`, rango): `h-9 px-3 rounded-xl text-xs font-bold bg-secondary/60 text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap`.

Pasos numerados (`ConfigView.tsx`):

```tsx
<ol className="flex flex-wrap gap-2" aria-label="Pasos">
  <li className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-xl bg-secondary/50 text-xs font-semibold text-slate-600">
    <span className="w-6 h-6 rounded-lg bg-white text-primary text-[11px] font-black flex items-center justify-center shadow-xs">1</span>
    Subí el archivo
  </li>
</ol>
```

Datos de solo lectura en mosaico (`ClientSheet.tsx`): `grid grid-cols-2 gap-3 text-sm`, cada uno
`rounded-xl bg-secondary/40 p-3` con la etiqueta `text-[10px] font-bold text-muted-foreground uppercase tracking-widest`
y el valor `font-semibold`.

Zona para soltar un archivo (`ExcelUpload.tsx`):

```tsx
<div role="button" tabIndex={0} className={`group border-2 border-dashed rounded-[1.75rem] px-6 py-10 md:py-14 text-center transition-all cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 ${
  encima ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-white/60 hover:border-primary/50 hover:bg-primary/[0.03]'
}`}>
  <div className="flex flex-col items-center gap-5">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors ${
      encima ? 'bg-primary text-white border-primary' : 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-white'
    }`}>
      <Upload size={26} strokeWidth={2} />
    </div>
    <div className="space-y-1">
      <p className="text-base font-bold text-foreground">Arrastrá la foto o hacé click para elegirla</p>
      <p className="text-xs text-muted-foreground">Archivos .jpg o .png</p>
    </div>
    <span className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">
      <FileSpreadsheet size={14} /> Elegir archivo
    </span>
  </div>
</div>
```

## 8. Botones

| Botón | Clases | Ícono |
|---|---|---|
| Principal de encabezado | `BOTON_DE_ENCABEZADO` de `estilos.ts`. Más simple que el de PRP por decisión de Santiago (2026-10-27): `h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold`, sin mayúsculas, sin sombra y sin saltito al pasar el mouse | 16 |
| Secundario de encabezado | `BOTON_DE_ENCABEZADO_SECUNDARIO`: el anterior con `bg-emerald-600 text-white` | 16 |
| Neutro de encabezado (extensión) | `BOTON_DE_ENCABEZADO_NEUTRO`: la misma forma con `border border-border bg-card text-foreground` y `hover:bg-secondary` | 16 |
| Principal de formulario | `h-12 px-6 rounded-xl bg-primary text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60` | 14 (`Save`) |
| Principal al pie de una ventana | `flex-[2] h-12 rounded-xl bg-primary text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2` | 16 |
| Cancelar | `flex-1 h-12 rounded-xl bg-secondary text-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-secondary/80 transition-all` | — |
| Cancelar sin fondo | `h-12 px-4 rounded-xl text-muted-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-secondary` | — |
| Confirmar algo de plata (pago) | `flex-[2] h-12 rounded-xl bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60` | 16 (`Check`) |
| Violeta (lo secundario) | `h-11 px-5 rounded-xl bg-violet-600 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-violet-600/20 flex items-center gap-2 active:scale-95 transition-all` | 14 |
| Peligro suave (dar de baja, anular) | `w-full h-10 rounded-xl border font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50 border-rose-200 text-rose-700 hover:bg-rose-50` | 14 |
| Reactivar | el anterior con `border-emerald-200 text-emerald-700 hover:bg-emerald-50` | 14 |
| WhatsApp | `bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 active:scale-95 transition-all` (hover `hover:bg-[#1fbd5b]`) | `MessageCircle` |
| Oscuro (vacío grande) | `h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl` | — |
| Blanco (vacío grande) | `h-14 rounded-2xl bg-white border border-border text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-md` | — |
| Ámbar (en un aviso) | `px-4 h-9 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors` | — |
| Neutro chico (Calcular) | `h-11 px-4 rounded-xl bg-secondary text-foreground font-bold text-[10px] uppercase tracking-widest hover:bg-secondary/80` | — |

Botones chicos de una fila de tabla:

| Botón | Clases |
|---|---|
| Acción principal | `inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 active:scale-95 transition-all duration-200` (ícono 13; el texto, `hidden 2xl:inline`) |
| Acción suave esmeralda | `inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 transition-all whitespace-nowrap` (ícono 14 y texto) |
| Editar | `p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200` (`Pencil` 16) |
| Borrar o anular | `p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200` (`Trash2` 16; para anular, `Ban`) |

En una lista (Mensajes) los chicos miden `h-9 min-w-9 sm:h-7 px-2.5` y esconden el texto hasta
`sm`.

Cerrar una ventana: `p-2 rounded-full hover:bg-secondary transition-colors` con `X` de 20 (18 en
la hoja lateral).

Rueda de "guardando" dentro de un botón:
`<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />`
o `<Loader2 size={16} className="animate-spin" />` (ingreso). Mientras guarda, el texto pasa a
"Guardando...".

## 9. Ventanas

Todas tapan con `fixed inset-0`, abajo en el celular (`items-end`, `rounded-t-3xl`) y al centro
desde `sm`. Se dibujan con `createPortal` **dentro de `<main>`** (no en `body` como PRP): quedan
fuera de la pantalla animada y su `role="alert"` queda en `main`, donde lo buscan las pruebas
(`aviso(page)` en `e2e/ayudas.ts`).

### Ventana con formulario (`ClientDialog.tsx`, `PaymentDialog.tsx`)

```tsx
<div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in-fade">
  <motion.div
    role="dialog"
    aria-label="Nuevo proveedor"
    className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[92vh] overflow-y-auto"
  >
    <div className="sticky top-0 z-10 px-5 sm:px-6 py-4 sm:py-5 border-b border-border bg-card flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <User size={18} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Nuevo proveedor</h2>
          <p className="text-xs text-muted-foreground">Subtítulo opcional</p>
        </div>
      </div>
      <button type="button" aria-label="Cerrar" className="p-2 rounded-full hover:bg-secondary transition-colors">
        <X size={20} />
      </button>
    </div>

    <form className="px-5 sm:px-6 pt-5 sm:pt-6 space-y-5">
      {/* campos */}
      <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 border-t border-border bg-card flex gap-3">
        {/* Cancelar (flex-1) y Guardar (flex-[2]) */}
      </div>
    </form>
  </motion.div>
</div>
```

- Ancho: `max-w-lg` (formularios largos) o `max-w-md` (cortos).
- Ícono del encabezado en verde (`bg-primary/10 text-primary`); para plata,
  `bg-emerald-500/10 text-emerald-600`.

Ventana simple, sin encabezado fijo (`PlansView.tsx`):
`bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border p-6 space-y-5 max-h-[92vh] overflow-y-auto`,
título `text-xl font-bold tracking-tight break-words` y botones `flex flex-col-reverse sm:flex-row gap-3`.

Terminado adentro de una ventana (`PaymentDialog.tsx`):

```tsx
<div className="p-6 space-y-5 text-center">
  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600">
    <Check size={30} />
  </div>
  <div>
    <h3 className="text-lg font-bold">Pago registrado</h3>
    <p className="text-sm text-muted-foreground mt-1">Renovado hasta el 21/11/2026.</p>
  </div>
</div>
```

### Confirmación (`useUnsavedChanges.tsx`)

PRP la usa para "Tenés cambios sin guardar" y pide borrar con `window.confirm`. En Manteca nada
se borra: anular pide motivo, y va con esta ventana más un texto largo para el motivo.

```tsx
<div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in-fade">
  <div role="alertdialog" aria-modal="true" aria-labelledby="titulo" aria-describedby="detalle"
    className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border p-6 space-y-5">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 shrink-0 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
        <AlertTriangle size={20} />
      </div>
      <div>
        <h2 id="titulo" className="text-lg font-bold tracking-tight">Tenés cambios sin guardar</h2>
        <p id="detalle" className="text-sm text-muted-foreground mt-1">Si salís ahora se pierden.</p>
      </div>
    </div>
    <div className="flex flex-col-reverse sm:flex-row gap-3">
      <button className="w-full sm:w-auto sm:flex-1 shrink-0 h-12 px-4 rounded-xl bg-secondary text-rose-700 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-colors">
        Salir sin guardar
      </button>
      <button autoFocus className="w-full sm:w-auto sm:flex-1 shrink-0 h-12 px-4 rounded-xl bg-primary text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
        Seguir editando
      </button>
    </div>
  </div>
</div>
```

### Hoja lateral (`ClientSheet.tsx`)

```tsx
<div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in-fade" onClick={cerrar}>
  <motion.aside role="dialog" aria-label="Ficha de Martín Gómez" onClick={(e) => e.stopPropagation()}
    className="h-full w-full sm:w-[460px] bg-card border-l border-border flex flex-col">
    <div className="p-5 border-b border-border flex items-start gap-3">
      <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase">M</div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold truncate">Martín Gómez</h3>
        <p className="text-xs font-mono text-muted-foreground">5491155550111</p>
      </div>
      <button type="button" aria-label="Cerrar ficha" className="p-2 rounded-full hover:bg-secondary transition-colors">
        <X size={18} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-5 space-y-6">{/* mosaicos, botones, historial */}</div>
  </motion.aside>
</div>
```

Sin sombra: PRP le pone `shadow-elevated`, una clase que no existe.

Historial:

```tsx
<ol className="space-y-3">
  <li className="flex gap-3">
    <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700">
      <BadgeDollarSign size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold">Pago de $4.800</p>
      <p className="text-xs text-muted-foreground break-words whitespace-pre-line">Transferencia</p>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">21/10/2026 a las 18:19</p>
    </div>
  </li>
</ol>
```

Colores del círculo: plata `bg-emerald-100 text-emerald-700`, nota `bg-amber-100 text-amber-700`,
cambio de estado `bg-violet-100 text-violet-700`.

### Ayuda de la pantalla (`ModuleHelp.tsx`)

Botón, al final del encabezado: `shrink-0 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-secondary transition-colors`
con `Info` de 22, `aria-label="Cómo funciona esta pantalla"`. Abre:

```tsx
<div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in-fade" onClick={cerrar}>
  <motion.div role="dialog" aria-label="Cómo funciona Proveedores" onClick={(e) => e.stopPropagation()}
    className="bg-card w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col">
    <div className="px-6 py-5 border-b border-border bg-secondary/20 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Info size={20} />
        </div>
        <h2 className="text-lg font-bold tracking-tight truncate">Cómo funciona Proveedores</h2>
      </div>
      <button type="button" aria-label="Cerrar ayuda" className="p-2 rounded-full hover:bg-secondary transition-colors shrink-0">
        <X size={20} />
      </button>
    </div>
    <div className="p-6 space-y-6 overflow-y-auto">
      <p className="text-sm text-muted-foreground leading-relaxed">Para qué es la pantalla.</p>
      <section className="space-y-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Un tema</h3>
        <ul className="space-y-2">
          <li className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            <span>Una explicación.</span>
          </li>
        </ul>
      </section>
    </div>
    <div className="p-4 border-t border-border bg-slate-50">
      <button type="button" className="w-full h-12 rounded-xl bg-primary text-white font-bold text-[10px] uppercase tracking-widest">Entendido</button>
    </div>
  </motion.div>
</div>
```

Se cierra con Escape, con la X, con "Entendido" y tocando afuera.

## 10. Avisos, notas, vacíos y éxito

### Avisos que se van solos (`components/ui/sonner.tsx`)

`toast.success(...)`, `toast.error(...)`, `toast.warning(...)`: una píldora oscura arriba al
centro. El `<Toaster />` va dentro de `<main>`, con esta configuración exacta:

```tsx
<Sonner
  theme="light"
  className="toaster group"
  position="top-center"
  offset={20}
  gap={8}
  duration={2600}
  icons={{
    success: <CheckCircle2 size={18} className="text-emerald-400" />,
    error: <XCircle size={18} className="text-rose-400" />,
    warning: <TriangleAlert size={18} className="text-amber-400" />,
    info: <Info size={18} className="text-sky-400" />,
    loading: <Loader2 size={18} className="text-slate-300 animate-spin" />,
  }}
  toastOptions={{
    unstyled: true,
    classNames: {
      toast: 'flex items-center gap-3 w-fit max-w-[calc(100vw-2rem)] mx-auto rounded-2xl bg-slate-900/95 backdrop-blur-md text-white pl-4 pr-5 py-3 shadow-2xl shadow-slate-900/25 ring-1 ring-white/10',
      icon: 'shrink-0 flex items-center',
      title: 'text-sm font-semibold tracking-tight',
      description: 'text-xs text-slate-300 mt-0.5',
      actionButton: 'ml-2 shrink-0 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold',
      cancelButton: 'ml-1 shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white',
    },
  }}
/>
```

Cuándo va cada cosa (como en PRP): lo que salió bien, en aviso que se va solo ("Proveedor
guardado"); el error de un formulario, escrito en el formulario (`role="alert"`). Si una prueba
espera el éxito escrito en la pantalla (`getByRole('main').getByRole('status')`), va la franja de
resultado de abajo, con `role="status"`.

### Franjas y notas

Advertencia con acción (`Index.tsx`):

```tsx
<div role="alert" className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
  <AlertTriangle size={18} className="shrink-0" />
  <p className="text-sm flex-1"><span className="font-bold">Faltan tus datos de cobro.</span>{' '}Qué hacer.</p>
  <button type="button" className="px-4 h-9 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors">Cargar datos</button>
</div>
```

Nota en ámbar: `rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1`,
con lo que se nombra en `font-bold`.

Resultado de una acción (`PlansView.tsx`):

```tsx
<div role="status" className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <p className="text-sm font-bold text-emerald-900">Se actualizó el precio de 12 productos.</p>
    <p className="text-xs text-emerald-800/80">El detalle en una línea.</p>
  </div>
</div>
```

Peligro informado: `rounded-lg border border-rose-200 bg-rose-50 p-3` con texto `text-sm text-rose-900`.

Error al cargar una sección: `<p role="alert" className="text-sm text-destructive bg-destructive/10 rounded-2xl p-4">`.

Cargando una sección: `<p className="text-sm text-muted-foreground px-1">Cargando...</p>` (PRP no
tiene esqueletos de carga).

### Vacío grande (`Index.tsx`, el panel sin datos)

```tsx
<div className="flex flex-col items-center justify-center py-14 md:py-20 px-6 md:px-8 bg-card rounded-[2rem] md:rounded-[3rem] border border-dashed border-slate-200 shadow-2xl shadow-slate-200/50 text-center animate-in zoom-in duration-700">
  <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 rotate-3 shadow-inner">
    <Download size={40} className="text-primary/40" />
  </div>
  <h3 className="text-2xl font-bold text-slate-900 mb-2">Comencemos la gestión.</h3>
  <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed mb-10">Qué falta para que esto se llene.</p>
  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">{/* botón oscuro y botón blanco */}</div>
</div>
```

## 11. Ingreso (`AuthPage.tsx`)

Para `/admin/ingresar` (y con la misma tarjeta, registro y cambio de contraseña):

```tsx
<div className="min-h-screen bg-background relative overflow-clip flex items-center justify-center p-4">
  <motion.div /* sube 20 px en 0,6 s */ className="w-full max-w-sm">
    <div className="flex flex-col items-center mb-10 text-center animate-in-fade">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-4 rotate-3">
        <Croissant className="text-white" size={32} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-4xl font-display font-extrabold tracking-tight leading-none text-slate-900">Manteca</p>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Sistema de gestión</p>
      </div>
    </div>

    <div className="bg-card/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/50 p-10">
      <h1 className="text-xl font-bold tracking-tight text-slate-800 mb-8 px-1">Ingresar</h1>
      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">Email</label>
          {/* campo con ícono Mail; si tiene error, aria-describedby apunta al texto del error */}
        </div>
        <div>
          <label htmlFor="contrasena" className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block px-1">Contraseña</label>
          {/* campo con ícono Lock */}
        </div>
        {error && <p role="alert" className="text-sm text-destructive bg-status-overdue p-2 rounded-md">{error}</p>}
        <button type="submit" className="w-full h-14 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
          Ingresar al sistema
        </button>
      </form>
    </div>
  </motion.div>
</div>
```

- El título de la tarjeta es el `h1` de esta página y dice **"Ingresar"**, como pide
  `e2e/acceso.spec.ts` (en PRP es un `h2` que dice "Iniciar sesión", y el `h1` es la marca).
- El botón dice "Ingresar…": la prueba lo busca por `Ingresar`.
- PRP le pone al botón `mt-10`, pero dentro del `space-y-4` no hacía nada en Tailwind 3: el botón
  queda a 16 px del último campo (`referencias/compu-01-ingreso.png`). En Tailwind 4 ese `mt-10`
  sí se aplicaría: no va.
- Sin las manchas de color del fondo: tampoco se ven en PRP (ver Marco).

## 12. Cómo se arma cada tipo de pantalla de Manteca

PRP es una sola página con vistas; Manteca tiene rutas. Cada tipo de pantalla se arma con las
piezas de arriba, en este orden:

| Pantalla | Se arma con |
|---|---|
| Inicio | encabezado; tarjetas de números; bloque oscuro del mes; tres paneles chicos; título de sección y pestañas con la tabla de lo urgente |
| Lista (Proveedores, Gastos, Ventas, Usuarios, Auditoría) | encabezado con botones; barra de filtros; tabla desde `xl` y tarjetas por debajo; sin resultados |
| Formulario en su propia ruta (`/nuevo`, `/editar`) | encabezado; tarjeta de sección de formulario (`border-border/50`) con los campos y el botón principal de formulario; si es largo, título de sección por bloque |
| Formulario corto sobre una lista | ventana con formulario |
| Detalle en su propia ruta (`/[id]`) | encabezado; mosaicos de datos; botones (peligro suave para anular); historial. Es la hoja lateral de PRP llevada a la página |
| Configuración (Caja → control, Menú → categorías) | títulos de sección con tarjetas de sección |
| Reportes | encabezado; filtros; paneles chicos con barras o Recharts; tabla |
| Ingreso, registro, cambio de contraseña | la pantalla de ingreso |
