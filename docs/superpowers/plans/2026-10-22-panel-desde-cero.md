# El panel desde cero (pedido 43): plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rehacer el front del panel con la estética de Plan Reminder Pro (skill `estetica-panel`) hasta que vuelvan a pasar todas sus pruebas de Playwright.

**Architecture:** Layout raíz propio para `/admin` con `panel.css`; marco (barra lateral y barras del celular) y piezas compartidas en `src/components/panel/`; cada pantalla compone esas piezas con la lógica que ya está en `src/lib/<módulo>/`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, radix-ui, lucide-react, framer-motion 12.36.0, sonner 1.7.4, lenis 1.1.20, React Hook Form + Zod, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-22-panel-desde-cero-design.md`

## Global Constraints

- La estética sale de la skill `estetica-panel`: clases de `piezas.md`, CSS de `panel.css`, componentes de `componentes-base.md`, movimiento de `movimiento.md`.
- Tests sin mocks (nada de `vi.mock`, `vi.fn` ni `page.route`); lo que toca datos, contra la base de pruebas.
- Funciones de `.ts` hasta 20 líneas, componentes `.tsx` hasta 80, archivos hasta 300 (sin blancos ni comentarios).
- La lógica va en `.ts`, no en los `.tsx`.
- Nombres, comentarios y textos en español; en pantalla, rioplatense con voseo.
- Plata en centavos enteros, mostrada con `src/lib/plata.ts`.
- Versiones exactas en `package.json`.
- `git add` con cada ruta; nunca `git add -A`. Commits chicos, conventional commits en español.
- Mergear a `main` y publicar lo decide Santiago.

## Review Focus

- Una pantalla que una prueba visita en el celular (Pixel 7, 412 px): nada tapado por las barras fijas ni texto cortado. Lo cubre la corrida de cada prueba en el proyecto `celular` al cerrar la fase.
- Un nombre largo de quien entró: no rompe el pie de la barra ni la barra de arriba (`truncate`). Se mira en las capturas de la Tarea 8.
- Una ventana abierta desde una pantalla animada: se dibuja dentro de `main` y fuera del contenedor animado. Lo prueba `e2e/ayuda.spec.ts` (Tarea 6), que la abre en el celular y en la computadora.
- Quien entra con una contraseña temporal no ve el marco del panel hasta cambiarla: lo cubre `cuenta.spec.ts` (Tarea 7).
- La carta pública no cambia al mover sus archivos: `menu-publico.spec.ts` e `inicio.spec.ts` siguen en verde (Tarea 1).

---

## Fase 0: base, marco y acceso

### Task 1: Dependencias y layouts raíz

**Files:**
- Modify: `package.json`, `package-lock.json` (con `npm install --save-exact framer-motion@12.36.0 sonner@1.7.4 lenis@1.1.20`)
- Move: `src/app/layout.tsx` → `src/app/(carta)/layout.tsx` (importa `'../globals.css'`), `src/app/page.tsx` → `src/app/(carta)/page.tsx`
- Create: `src/app/admin/panel.css` (copia exacta de `.claude/skills/estetica-panel/panel.css`)
- Create: `src/app/admin/layout.tsx`

**Interfaces:**
- Produces: `LayoutDelPanel` raíz con `metadata = { title: { template: '%s · Manteca', default: 'Manteca' }, robots: { index: false, follow: false } }`, `viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }`, `<html lang="es-AR" className={inter.variable + outfit.variable}>`.

- [ ] **Step 1:** Correr `npm run e2e -- e2e/menu-publico.spec.ts e2e/inicio.spec.ts --project=computadora`: en verde antes de mover nada.
- [ ] **Step 2:** Instalar las tres librerías exactas, mover la carta, crear `panel.css` y el layout raíz del panel (letras con `next/font/google`: `Inter` y `Outfit`, `subsets: ['latin']`, `weight: '400 700'`, `display: 'swap'`, `variable: '--font-inter'` / `'--font-outfit'`).
- [ ] **Step 3:** `npm run tipos` y la misma corrida del Step 1: siguen en verde.
- [ ] **Step 4:** Commit `chore: layout raiz propio del panel con panel.css y sus letras`.

### Task 2: Componentes base y estilos compartidos

**Files:**
- Create: `src/components/ui/input.tsx`, `select.tsx`, `tabs.tsx`, `tooltip.tsx`, `sonner.tsx` (código de `componentes-base.md`)
- Create: `src/components/panel/estilos.ts`

**Interfaces:**
- Produces: `Input`, `Select*`, `Tabs*`, `Tooltip*`, `Toaster`, `toast`; en `estilos.ts` las clases de `piezas.md` que se repiten: `ETIQUETA`, `CAMPO`, `BOTON_PRINCIPAL`, `BOTON_PRINCIPAL_AL_PIE`, `BOTON_CANCELAR`, `BOTON_DE_ENCABEZADO`, `TARJETA_DE_SECCION`, `TARJETA_DE_FORMULARIO`, `CERRAR_VENTANA`.

- [ ] **Step 1:** Escribir los cinco componentes y `estilos.ts`.
- [ ] **Step 2:** `npx vitest run --project puros tests/contraste.test.ts` en verde (ningún `ring-ring/`) y `npm run tipos`.
- [ ] **Step 3:** Commit `feat: componentes base del panel con la estetica de Plan Reminder Pro`.

### Task 3: Lógica nueva del marco y de la ayuda

**Files:**
- Modify: `src/lib/acceso/navegacion.ts`, `src/lib/acceso/navegacion.test.ts`
- Create: `src/lib/panel/ayudas.ts`, `src/lib/panel/ayudas.test.ts`, `src/lib/panel/scrollSuave.ts`

**Interfaces:**
- Produces: `activoEnMas(mas: { clave: string }[], activo: string | null): boolean`; `type Ayuda = { titulo: string; introduccion: string; temas: { titulo: string; puntos: string[] }[] }`; `AYUDAS: Record<ClaveDeAyuda, Ayuda>` con `ClaveDeAyuda = 'inicio' | 'cuenta'` (crece con cada fase); `arrancarScrollSuave(): void`, `volverArriba(): void` (de `movimiento.md`).

- [ ] **Step 1: Tests que fallan**

```ts
describe('activoEnMas', () => {
  const mas = [{ clave: 'proveedores' }, { clave: 'usuarios' }];
  it('marca Más cuando la sección activa quedó adentro', () => {
    expect(activoEnMas(mas, 'usuarios')).toBe(true);
  });
  it('no lo marca si la activa está abajo o no hay ninguna', () => {
    expect(activoEnMas(mas, 'gastos')).toBe(false);
    expect(activoEnMas(mas, null)).toBe(false);
  });
});

describe('ayudas', () => {
  it('cada ayuda tiene título, introducción y al menos un tema con puntos', () => {
    for (const ayuda of Object.values(AYUDAS)) {
      expect(ayuda.titulo).toMatch(/^Cómo funciona /);
      expect(ayuda.introduccion.length).toBeGreaterThan(0);
      expect(ayuda.temas.length).toBeGreaterThan(0);
      for (const tema of ayuda.temas) expect(tema.puntos.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2:** `npx vitest run --project puros src/lib/acceso/navegacion.test.ts src/lib/panel/ayudas.test.ts`: falla (no existen).
- [ ] **Step 3:** Implementar `activoEnMas`, `AYUDAS` (Inicio y Mi cuenta, en voseo, desde `docs/modulos/09-inicio.md` y `01-usuarios.md`) y `scrollSuave.ts`.
- [ ] **Step 4:** La misma corrida, en verde. Commit `feat: logica del marco y textos de ayuda del panel`.

### Task 4: Ingreso, registro y cambio obligado

**Files:**
- Create: `src/components/formularios/Campo.tsx` (`Campo`, `ErrorDeCampo`), `CampoContrasena.tsx`, `AvisoDeError.tsx`, `AvisoDeExito.tsx`
- Create: `src/components/panel/Marca.tsx`
- Create: `src/app/admin/(acceso)/layout.tsx` (el marco de la pantalla de ingreso de PRP, con `<main>`)
- Create: `src/app/admin/(acceso)/ingresar/page.tsx`, `FormularioIngreso.tsx`; `registro/page.tsx`, `FormularioRegistro.tsx`; `cambiar-contrasena/page.tsx`, `FormularioCambioObligado.tsx`

**Interfaces:**
- Consumes: `ingresarAlPanel`, `registrarse`, `guardarContrasenaNueva` (acciones que ya existen), `useEnvio`, `atributosDeError`, `idDelError`, `soloSinSesion`, `exigirPagina('cambiar-contrasena')`.
- Produces: `Campo({ id, etiqueta, error, icono?, variante?: 'panel' | 'ingreso', ...input })`; `CampoContrasena` con el ojo de PRP (`nombreDelBotonDeContrasena`); `AvisoDeError({ mensaje, variante?: 'texto' | 'caja' })` con `role="alert"`; `AvisoDeExito({ titulo, detalle? })` con `role="status"`; `Marca({ tamano: 'lateral' | 'barra' | 'ingreso' })` con `role="img"` y `aria-label="Manteca"`.

- [ ] **Step 1:** `npm run e2e -- e2e/registro.spec.ts --project=computadora`: falla (404).
- [ ] **Step 2:** Construir las piezas y las tres pantallas con los textos de las pruebas: h1 "Ingresar", "Crear una cuenta" y "Cambiá tu contraseña"; botones "Ingresar al sistema", "Registrarme" y "Guardar contraseña"; enlaces "Crear una cuenta" e "Ingresar".
- [ ] **Step 3:** La misma corrida: pasan "no deja registrar un email que ya tiene cuenta", "marca los datos que faltan", "el ingreso y el registro se enlazan" y la captura. La primera espera el panel (Tarea 5).
- [ ] **Step 4:** `npm run tipos`. Commit `feat: ingreso, registro y cambio obligado con la estetica de Plan Reminder Pro`.

### Task 5: Marco del panel e Inicio por rol

**Files:**
- Create: `src/components/panel/iconos.ts`, `EnlaceLateral.tsx`, `BarraLateral.tsx`, `PieDeSesion.tsx`, `BotonSalir.tsx`, `BarrasDelCelular.tsx`, `EnlaceDeAbajo.tsx`, `Insignia.tsx`, `MasSecciones.tsx`, `MarcoDelPanel.tsx`, `ScrollSuave.tsx`, `EncabezadoDePantalla.tsx`, `EntradaDePantalla.tsx`, `Inicios.tsx`
- Create: `src/app/admin/(panel)/layout.tsx`, `src/app/admin/(panel)/page.tsx`

**Interfaces:**
- Consumes: `datosDelMarco`, `exigirPagina('panel')`, `enlaceActivo`, `repartirParaCelular`, `insigniaDeMas`, `activoEnMas`, `Marca`.
- Produces: `MarcoDelPanel({ nombre, enlaces, children })`; `EncabezadoDePantalla({ titulo, subtitulo?, acciones?, ayuda? })` (h1 con las clases de PRP y el bloque animado de `movimiento.md`); `EntradaDePantalla({ children })` (sube 20 px en 0,3 s); `InicioCaja({ nombre })` con el enlace "Cargar el cierre de caja"; `EsperaDeAcceso()` con el texto de espera. Inicio del admin, por ahora el encabezado "Inicio" (la Fase 1 lo completa).

- [ ] **Step 1:** `npm run e2e -- e2e/acceso.spec.ts --project=computadora`: falla.
- [ ] **Step 2:** Construir el marco (`piezas.md`, Marco), el encabezado y los inicios.
- [ ] **Step 3:** `npm run e2e -- e2e/acceso.spec.ts e2e/registro.spec.ts --project=computadora`: en verde.
- [ ] **Step 4:** `npm run tipos`. Commit `feat: marco del panel e inicio por rol con la estetica de Plan Reminder Pro`.

### Task 6: Ayuda de la pantalla

**Files:**
- Create: `e2e/ayuda.spec.ts`
- Create: `src/components/panel/Ayuda.tsx` (botón ⓘ y ventana, con `createPortal` dentro de `main`)
- Modify: `src/components/panel/EncabezadoDePantalla.tsx` (recibe `ayuda?: Ayuda`)

**Interfaces:**
- Consumes: `AYUDAS`, `EncabezadoDePantalla`.
- Produces: `BotonDeAyuda({ ayuda }: { ayuda: Ayuda })`.

- [ ] **Step 1: La prueba que falla**

```ts
test.use({ storageState: SESIONES.admin });

test('la ayuda de la pantalla se abre y se cierra', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Cómo funciona esta pantalla' }).click();
  const ventana = page.getByRole('dialog', { name: 'Cómo funciona Inicio' });
  await expect(ventana).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(ventana).toHaveCount(0);
  await page.getByRole('button', { name: 'Cómo funciona esta pantalla' }).click();
  await ventana.getByRole('button', { name: 'Entendido' }).click();
  await expect(ventana).toHaveCount(0);
});
```

- [ ] **Step 2:** `npm run e2e -- e2e/ayuda.spec.ts --project=computadora`: falla (no hay botón).
- [ ] **Step 3:** Construir `BotonDeAyuda` (`piezas.md`, Ayuda de la pantalla) y pasarle la ayuda al encabezado de Inicio.
- [ ] **Step 4:** La misma corrida, en verde en `computadora` y `celular`. Commit `feat: ayuda de cada pantalla del panel`.

### Task 7: Mi cuenta

**Files:**
- Create: `src/app/admin/(panel)/cuenta/page.tsx`, `FormularioCambioDeContrasena.tsx`, `src/components/panel/DatosDeLaCuenta.tsx`

**Interfaces:**
- Consumes: `cambiarMiContrasena` (ya existe), `nombreDeRol`, `CampoContrasena`, `AvisoDeError`, `AvisoDeExito`, `EncabezadoDePantalla`, `AYUDAS.cuenta`.

- [ ] **Step 1:** `npm run e2e -- e2e/cuenta.spec.ts --project=computadora`: falla.
- [ ] **Step 2:** Construir la pantalla: los datos en los mosaicos de la ficha de PRP (`dl` con `dt`/`dd`), el formulario en la tarjeta de formulario, "Listo, cambiaste tu contraseña." en la franja de resultado (`role="status"`, dentro de `main`).
- [ ] **Step 3:** La misma corrida, en verde. Commit `feat: Mi cuenta con la estetica de Plan Reminder Pro`.

### Task 8: Cierre de la Fase 0

- [ ] **Step 1:** `npm run lint`, `npm run tipos` y `npx vitest run --project puros`: en verde.
- [ ] **Step 2:** `npm run e2e -- e2e/acceso.spec.ts e2e/registro.spec.ts e2e/cuenta.spec.ts e2e/ayuda.spec.ts e2e/inicio.spec.ts e2e/menu-publico.spec.ts` (los dos proyectos): en verde.
- [ ] **Step 3:** Capturas del ingreso, el inicio y Mi cuenta a 1440×900 y 390×844, comparadas con `referencias/compu-01-ingreso.png`, `compu-02-dashboard.png` (marco) y `celu-02-dashboard.png`. Lo que no coincida se corrige antes de seguir.
- [ ] **Step 4:** Nota en el pedido 43 de `PEDIDOS.md` (qué fase quedó) y commit.

## Fases 1 a 9

Se planifican al empezar cada una, con el mismo formato y con la tabla de la spec: leer sus
pruebas, su archivo de `docs/modulos/` y su `pantalla.ts`; correr sus pruebas para verlas
fallar; construir las pantallas con las piezas de `piezas.md`; correr sus pruebas en los dos
proyectos; capturas contra `referencias/`; commit.
