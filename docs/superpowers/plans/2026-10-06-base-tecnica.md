# Base técnica y guía de estilos: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el proyecto Next.js armado, con el lint controlando las reglas de código, los tres tipos de test corriendo contra la base de pruebas y la guía de estilos con la identidad de Manteca.

**Architecture:** Un solo proyecto Next.js 16 (App Router) en la raíz del repo, con el código en `src/`. Vitest corre dos grupos (`puros`, sin base; `base`, contra Supabase de pruebas) y Playwright prueba en el navegador a la vista. La preparación de los tests comprueba que la base sea la de pruebas y siembra seis cuentas. Los tokens de diseño viven en `src/app/globals.css` y la página `/admin/guia-de-estilos` los muestra.

**Tech Stack:** Next.js 16, React 19, TypeScript estricto, Tailwind 4, shadcn/ui, Supabase (`@supabase/supabase-js`), Zod 4, Vitest, Playwright, ESLint, Prettier, tsx.

**Spec:** `docs/superpowers/specs/2026-10-06-base-tecnica-design.md`

## Global Constraints

- **Quién decide:** solo Santiago autoriza aplicar algo a la base real, publicar en producción y cualquier excepción a estas reglas. Si una tarea no se puede cumplir como está escrita, se frena y se le avisa.
- **TDD:** primero el test, se lo corre y se lo ve fallar, después el código. Código escrito antes que su test se borra y se rehace desde el test.
- **Tests sin mocks:** nada de `vi.mock`, `vi.fn` como reemplazo, `page.route` ni clientes falsos armados a mano. La fecha entra como parámetro; no se congela el reloj.
- **Largo:** 20 líneas por función en `.ts`, 80 por componente en `.tsx`, 300 por archivo, sin contar blancos ni comentarios. Si el lint falla por largo, se divide el código; la regla no se desactiva.
- **La lógica no vive en los `.tsx`:** datos y cálculos van en un `.ts`.
- **Idioma:** nombres, comentarios y mensajes en español. `camelCase` para variables y funciones, `PascalCase` para tipos y componentes. Textos de pantalla en rioplatense con voseo. Un comentario explica el porqué, no el qué.
- **Plata en centavos enteros:** `number` entero, nombres terminados en `Centavos`. Nunca punto flotante para un monto. Se muestra como `$1.234,50`.
- **Clave secreta:** se lee y se usa solo en `src/lib/supabase/secreto.ts`. Nunca se escribe en el repo ni en la salida de un comando.
- **Bases:** los tests corren solo contra la de pruebas (`nrevmkmpaaoobpmgkzhh`). Por MCP se usa `supabase-pruebas`; nunca el servidor `supabase` general, y `supabase-real` no se toca en este plan.
- **Guía de estilos:** ninguna pantalla define colores, tipografías ni medidas sueltas: usa los tokens de `globals.css`.
- **Versiones exactas:** todo se instala con `--save-exact`. Se parte de la última estable. Si una versión mayor nueva no es compatible con Next.js 16, se instala la más alta que sí lo sea y se anota en el mensaje del commit cuál y por qué.
- **Worktrees:** no se usan. Se trabaja en la rama `feat/base-tecnica` de este directorio.
- **Git:** commits chicos con conventional commits en español. Cada archivo se agrega con su ruta; nunca `git add -A` ni `git add .`. Cada commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Shell:** los comandos están escritos para Git Bash en Windows, corridos desde la raíz del repo.

## Review Focus

1. **Monto que no es un entero de centavos** (`1.5`, `NaN`): `formatearPesos` tiene que rechazarlo con un error, no mostrar un número raro. Test en la Tarea 1.
2. **URL de Supabase parecida a la de pruebas** (`https://<ref>.supabase.co.otro.com`, o el identificador vacío): la comprobación tiene que rechazarla. Test en la Tarea 3.
3. **Falta `.env.local` o una variable:** el error tiene que nombrar la variable que falta, en español, y no ser un error interno de Supabase. Test en la Tarea 3.
4. **Email con mayúsculas** (`prueba.adminOtroLocal@manteca.test`): Supabase lo guarda en minúsculas; sembrar por segunda vez no tiene que intentar crearlo de nuevo ni fallar. Test en la Tarea 4.
5. **La guía en un celular:** ninguna sección puede desbordar a lo ancho. Test en la Tarea 6.

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `package.json` | Dependencias con versión exacta y los comandos |
| `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` | Configuración del proyecto |
| `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore` | Reglas de código |
| `.gitignore`, `.env.example` | Qué no se sube; qué variables existen |
| `vitest.config.ts` | Los grupos `puros` y `base` |
| `playwright.config.ts` | Navegador a la vista, dos tamaños, servidor local |
| `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx` | Marco, tokens y página provisoria |
| `src/app/admin/guia-de-estilos/page.tsx` | La página de la guía |
| `src/components/guia/*.tsx` | Una sección de la guía por archivo |
| `src/components/ui/*` | Componentes de shadcn (generados) |
| `src/lib/plata.ts` | Mostrar un monto |
| `src/lib/fechas.ts` | El día en Argentina |
| `src/lib/entorno/validar.ts`, `publico.ts`, `servidor.ts` | Leer y validar variables |
| `src/lib/supabase/secreto.ts` | El único cliente con la clave secreta |
| `src/lib/guia/tokens.ts` | La lista de tokens que muestra la guía |
| `tests/base-de-pruebas.ts` | Comprobar que la base es la de pruebas |
| `tests/entorno-pruebas.ts` | Cargar `.env.local` y leer las variables de los tests |
| `tests/cuentas.ts` | Las seis cuentas de prueba y cómo sembrarlas |
| `tests/clientes.ts` | Cliente firmado como una cuenta de prueba |
| `tests/preparar.ts`, `tests/preparacion-base.ts` | Preparación compartida y la de Vitest |
| `scripts/sembrar-pruebas.ts` | El comando `sembrar:pruebas` |
| `e2e/preparacion.ts`, `e2e/*.spec.ts` | Preparación y pruebas de Playwright |
| `public/fonts/*` | Manic y Neufile Grotesk |

---

### Task 1: Proyecto, lint, Vitest y `formatearPesos`

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `vitest.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/lib/plata.ts`
- Test: `src/lib/plata.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `formatearPesos(centavos: number): string`. Los comandos `npm run lint`, `npm run tipos`, `npm test`. El alias `@/` apuntando a `src/`. Los grupos de Vitest `puros` (archivos `*.test.ts`) y `base` (archivos `*.base.test.ts`).

- [ ] **Step 1: Crear `package.json`**

```json
{
  "name": "sistema-manteca",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "tipos": "tsc --noEmit",
    "test": "vitest run",
    "verificar": "npm run lint && npm run tipos && npm test && npm run build",
    "e2e": "playwright test",
    "sembrar:pruebas": "tsx scripts/sembrar-pruebas.ts"
  }
}
```

- [ ] **Step 2: Instalar las dependencias con versión exacta**

```bash
npm install --save-exact next react react-dom zod @supabase/supabase-js
npm install --save-exact --save-dev typescript @types/node @types/react @types/react-dom eslint eslint-config-next prettier tailwindcss @tailwindcss/postcss vitest @playwright/test tsx
```

Expected: termina sin errores de dependencias (`ERESOLVE`). Si una versión mayor nueva choca con Next.js 16 (el caso probable es `typescript` o `eslint`), instalar la mayor anterior de ese paquete con `--save-exact` y anotarlo para el mensaje del commit.

Verificar que no quedó ningún `^` ni `~`:

```bash
grep -E '"[\^~]' package.json
```

Expected: sin salida.

- [ ] **Step 3: Crear `.gitignore`**

```gitignore
node_modules/
.next/
out/
next-env.d.ts
*.tsbuildinfo

.env.local
.env*.local

test-results/
playwright-report/
e2e/capturas/

.vercel/
```

- [ ] **Step 4: Crear `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Crear `next.config.ts` y `postcss.config.mjs`**

`next.config.ts`:

```ts
import type { NextConfig } from 'next';

const configuracion: NextConfig = {};

export default configuracion;
```

`postcss.config.mjs`:

```js
const configuracion = {
  plugins: { '@tailwindcss/postcss': {} },
};

export default configuracion;
```

- [ ] **Step 6: Crear `eslint.config.mjs`**

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const sinBlancosNiComentarios = { skipBlankLines: true, skipComments: true };

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.ts', '**/*.mjs'],
    rules: {
      'max-lines-per-function': ['error', { max: 20, ...sinBlancosNiComentarios }],
      'max-lines': ['error', { max: 300, ...sinBlancosNiComentarios }],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['error', { max: 80, ...sinBlancosNiComentarios }],
      'max-lines': ['error', { max: 300, ...sinBlancosNiComentarios }],
    },
  },
  {
    // Un describe es una funcion: en los tests vale el limite de archivo.
    files: ['**/*.test.ts', 'e2e/**/*.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
  globalIgnores([
    '.next/**',
    'next-env.d.ts',
    'src/components/ui/**',
    'src/lib/supabase/tipos.ts',
    'test-results/**',
    'playwright-report/**',
  ]),
]);
```

- [ ] **Step 7: Crear `.prettierrc.json` y `.prettierignore`**

`.prettierrc.json`:

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

`.prettierignore`:

```gitignore
.next/
node_modules/
package-lock.json
src/components/ui/
test-results/
playwright-report/
docs/
*.md
```

- [ ] **Step 8: Crear `vitest.config.ts`**

```ts
import path from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'puros',
          include: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'scripts/**/*.test.ts'],
          exclude: ['**/*.base.test.ts', 'node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'base',
          include: ['src/**/*.base.test.ts', 'tests/**/*.base.test.ts'],
          exclude: ['node_modules/**'],
          globalSetup: ['tests/preparacion-base.ts'],
          // Los tests comparten la base de pruebas: de a un archivo por vez.
          fileParallelism: false,
          env: loadEnv('test', process.cwd(), ''),
        },
      },
    ],
  },
});
```

El grupo `base` todavía no tiene archivos ni su preparación: llegan en la Tarea 4. Hasta entonces se corre solo `puros`, con `--project puros`. Si Vitest se niega a arrancar porque falta `tests/preparacion-base.ts`, se saca el grupo `base` de este archivo y se lo agrega en la Tarea 4, en el mismo commit que su preparación.

- [ ] **Step 9: Crear `src/app/globals.css` y `src/app/layout.tsx` mínimos**

`src/app/globals.css`:

```css
@import 'tailwindcss';
```

`src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manteca',
  description: 'Sistema de gestión de Manteca',
};

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Escribir el test que falla**

`src/lib/plata.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatearPesos } from './plata';

describe('formatearPesos', () => {
  it('muestra cero con dos decimales', () => {
    expect(formatearPesos(0)).toBe('$0,00');
  });

  it('muestra centavos sueltos', () => {
    expect(formatearPesos(5)).toBe('$0,05');
  });

  it('separa los miles con punto y los decimales con coma', () => {
    expect(formatearPesos(123450)).toBe('$1.234,50');
  });

  it('separa los millones', () => {
    expect(formatearPesos(100000000)).toBe('$1.000.000,00');
  });

  it('pone el signo antes del peso en un monto negativo', () => {
    expect(formatearPesos(-123450)).toBe('-$1.234,50');
  });

  it('muestra centavos negativos sin perder el signo', () => {
    expect(formatearPesos(-5)).toBe('-$0,05');
  });

  it('rechaza un monto con decimales', () => {
    expect(() => formatearPesos(1.5)).toThrow('entero de centavos');
  });

  it('rechaza un monto que no es un numero', () => {
    expect(() => formatearPesos(Number.NaN)).toThrow('entero de centavos');
  });
});
```

- [ ] **Step 11: Correr el test y verlo fallar**

Run: `npx vitest run --project puros src/lib/plata.test.ts`
Expected: FAIL, porque no se puede resolver `./plata`.

- [ ] **Step 12: Escribir la implementación mínima**

`src/lib/plata.ts`:

```ts
/** Muestra un monto en centavos enteros como $1.234,50. */
export function formatearPesos(centavos: number): string {
  if (!Number.isInteger(centavos)) {
    throw new Error(`Un monto tiene que ser un entero de centavos y llegó: ${centavos}`);
  }
  const signo = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  // Se separa con enteros para no pasar nunca por punto flotante.
  const pesos = String(Math.trunc(absoluto / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const resto = String(absoluto % 100).padStart(2, '0');
  return `${signo}$${pesos},${resto}`;
}
```

- [ ] **Step 13: Correr el test y verlo pasar**

Run: `npx vitest run --project puros src/lib/plata.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 14: Correr lint y tipos**

Run: `npm run lint && npm run tipos`
Expected: los dos terminan sin errores. Si `eslint-config-next` no acepta la versión de ESLint instalada, bajar ESLint a la mayor que acepte (`npm view eslint-config-next peerDependencies` la indica), con `--save-exact`.

- [ ] **Step 15: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs .prettierrc.json .prettierignore .gitignore vitest.config.ts src/app/layout.tsx src/app/globals.css
git commit -m "chore: arma el proyecto con Next.js, lint y Vitest

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/lib/plata.test.ts
git commit -m "test: formatear un monto en centavos como pesos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/lib/plata.ts
git commit -m "feat: formatea un monto en centavos como pesos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `diaEnArgentina`

**Files:**
- Create: `src/lib/fechas.ts`
- Test: `src/lib/fechas.test.ts`

**Interfaces:**
- Consumes: el grupo `puros` de Vitest (Tarea 1).
- Produces: `diaEnArgentina(instante: Date): string`, que devuelve `AAAA-MM-DD`.

- [ ] **Step 1: Escribir el test que falla**

`src/lib/fechas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { diaEnArgentina } from './fechas';

describe('diaEnArgentina', () => {
  it('una venta de las 23:30 de Argentina cae en ese dia, aunque en UTC ya sea el siguiente', () => {
    expect(diaEnArgentina(new Date('2026-10-07T02:30:00Z'))).toBe('2026-10-06');
  });

  it('una venta de las 00:30 de Argentina cae en el dia nuevo', () => {
    expect(diaEnArgentina(new Date('2026-10-07T03:30:00Z'))).toBe('2026-10-07');
  });

  it('respeta el cambio de año', () => {
    expect(diaEnArgentina(new Date('2027-01-01T02:59:59Z'))).toBe('2026-12-31');
  });

  it('rechaza una fecha invalida', () => {
    expect(() => diaEnArgentina(new Date('no es una fecha'))).toThrow('no es válida');
  });
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run --project puros src/lib/fechas.test.ts`
Expected: FAIL, porque no se puede resolver `./fechas`.

- [ ] **Step 3: Escribir la implementación mínima**

`src/lib/fechas.ts`:

```ts
// El formato en-CA escribe AAAA-MM-DD, que es como se guarda un dia en la base.
const FORMATO_DIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Devuelve el dia calendario en Argentina de un instante, como AAAA-MM-DD. */
export function diaEnArgentina(instante: Date): string {
  if (Number.isNaN(instante.getTime())) {
    throw new Error('La fecha no es válida');
  }
  return FORMATO_DIA.format(instante);
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run --project puros src/lib/fechas.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fechas.test.ts
git commit -m "test: el dia en Argentina de un instante

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/lib/fechas.ts
git commit -m "feat: calcula el dia en Argentina de un instante

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Variables de entorno y comprobación de la base

**Files:**
- Create: `src/lib/entorno/validar.ts`, `src/lib/entorno/publico.ts`, `src/lib/entorno/servidor.ts`
- Create: `tests/base-de-pruebas.ts`, `tests/entorno-pruebas.ts`
- Create: `.env.example`, `.env.local` (este último no se commitea)
- Test: `src/lib/entorno/validar.test.ts`, `tests/base-de-pruebas.test.ts`

**Interfaces:**
- Consumes: el grupo `puros` de Vitest (Tarea 1).
- Produces:
  - `validarEntorno<T extends z.ZodType>(esquema: T, valores: Record<string, string | undefined>): z.infer<T>`
  - `leerEntornoPublico(): { NEXT_PUBLIC_SUPABASE_URL: string; NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string }`
  - `leerEntornoServidor(): { SUPABASE_SECRET_KEY: string }`
  - `esBaseDePruebas(url: string, ref: string): boolean`
  - `exigirBaseDePruebas(url: string, ref: string): void`
  - `cargarEntornoLocal(): void`
  - `leerEntornoPruebas(): { SUPABASE_REF_PRUEBAS: string; CONTRASENA_USUARIOS_PRUEBA: string }`

- [ ] **Step 1: Escribir el test de `validarEntorno`, que falla**

`src/lib/entorno/validar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validarEntorno } from './validar';

const esquema = z.object({
  UNA_URL: z.url(),
  UNA_CLAVE: z.string().min(1),
});

describe('validarEntorno', () => {
  it('devuelve los valores cuando estan todos', () => {
    const valores = { UNA_URL: 'https://ejemplo.supabase.co', UNA_CLAVE: 'abc' };
    expect(validarEntorno(esquema, valores)).toEqual(valores);
  });

  it('nombra la variable que falta', () => {
    const valores = { UNA_URL: 'https://ejemplo.supabase.co', UNA_CLAVE: undefined };
    expect(() => validarEntorno(esquema, valores)).toThrow('UNA_CLAVE');
  });

  it('nombra la variable vacia', () => {
    const valores = { UNA_URL: 'https://ejemplo.supabase.co', UNA_CLAVE: '' };
    expect(() => validarEntorno(esquema, valores)).toThrow('UNA_CLAVE');
  });

  it('nombra todas las que estan mal, no solo la primera', () => {
    const error = capturar(() => validarEntorno(esquema, { UNA_URL: 'no-es-url' }));
    expect(error).toContain('UNA_URL');
    expect(error).toContain('UNA_CLAVE');
  });

  it('explica en español donde se cargan', () => {
    expect(() => validarEntorno(esquema, {})).toThrow('.env.local');
  });
});

function capturar(accion: () => unknown): string {
  try {
    accion();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return '';
}
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run --project puros src/lib/entorno/validar.test.ts`
Expected: FAIL, porque no se puede resolver `./validar`.

- [ ] **Step 3: Escribir `validar.ts`**

`src/lib/entorno/validar.ts`:

```ts
import type { z } from 'zod';

/** Valida variables de entorno y, si alguna falta, dice cuales. */
export function validarEntorno<T extends z.ZodType>(
  esquema: T,
  valores: Record<string, string | undefined>,
): z.infer<T> {
  const resultado = esquema.safeParse(valores);
  if (resultado.success) return resultado.data;
  const nombres = [...new Set(resultado.error.issues.map((problema) => problema.path.join('.')))];
  throw new Error(
    `Faltan o están mal estas variables de entorno: ${nombres.join(', ')}. ` +
      'En local se cargan en .env.local (ver .env.example).',
  );
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

Run: `npx vitest run --project puros src/lib/entorno/validar.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Escribir el test de la comprobación de la base, que falla**

`tests/base-de-pruebas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { esBaseDePruebas, exigirBaseDePruebas } from './base-de-pruebas';

const REF = 'abcdefghijklmnopqrst';

describe('esBaseDePruebas', () => {
  it('acepta la URL del proyecto de pruebas', () => {
    expect(esBaseDePruebas(`https://${REF}.supabase.co`, REF)).toBe(true);
  });

  it('rechaza la URL de otro proyecto', () => {
    expect(esBaseDePruebas('https://zyxwvutsrqponmlkjihg.supabase.co', REF)).toBe(false);
  });

  it('rechaza un dominio que solo empieza igual', () => {
    expect(esBaseDePruebas(`https://${REF}.supabase.co.otro.com`, REF)).toBe(false);
  });

  it('rechaza una URL que solo contiene el identificador', () => {
    expect(esBaseDePruebas(`https://otro.supabase.co/${REF}`, REF)).toBe(false);
  });

  it('rechaza si el identificador esta vacio', () => {
    expect(esBaseDePruebas('https://.supabase.co', '')).toBe(false);
  });

  it('rechaza algo que no es una URL', () => {
    expect(esBaseDePruebas('no es una url', REF)).toBe(false);
  });
});

describe('exigirBaseDePruebas', () => {
  it('no hace nada si la base es la de pruebas', () => {
    expect(() => exigirBaseDePruebas(`https://${REF}.supabase.co`, REF)).not.toThrow();
  });

  it('aborta y dice por que si no lo es', () => {
    expect(() => exigirBaseDePruebas('https://otro.supabase.co', REF)).toThrow(
      'no es la del proyecto de pruebas',
    );
  });
});
```

- [ ] **Step 6: Correr el test y verlo fallar**

Run: `npx vitest run --project puros tests/base-de-pruebas.test.ts`
Expected: FAIL, porque no se puede resolver `./base-de-pruebas`.

- [ ] **Step 7: Escribir `tests/base-de-pruebas.ts`**

```ts
/** Dice si una URL de Supabase es exactamente la del proyecto de pruebas. */
export function esBaseDePruebas(url: string, ref: string): boolean {
  if (ref === '') return false;
  try {
    return new URL(url).hostname === `${ref}.supabase.co`;
  } catch {
    return false;
  }
}

/** Aborta si la base no es la de pruebas: los tests siembran y borran datos. */
export function exigirBaseDePruebas(url: string, ref: string): void {
  if (esBaseDePruebas(url, ref)) return;
  throw new Error(
    `La URL de Supabase (${url}) no es la del proyecto de pruebas (${ref}). No se corre nada.`,
  );
}
```

- [ ] **Step 8: Correr el test y verlo pasar**

Run: `npx vitest run --project puros tests/base-de-pruebas.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 9: Escribir los lectores de variables**

No llevan test propio: son la lista de variables pasada a `validarEntorno`, que ya está probada. Los ejercita la Tarea 4 contra la base.

`src/lib/entorno/publico.ts`:

```ts
import { z } from 'zod';
import { validarEntorno } from './validar';

const esquema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

/** Variables que tambien viajan al navegador. */
export function leerEntornoPublico(): z.infer<typeof esquema> {
  // Se nombran una por una porque Next.js solo las reemplaza si las ve escritas asi.
  return validarEntorno(esquema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
```

`src/lib/entorno/servidor.ts`:

```ts
import { z } from 'zod';
import { validarEntorno } from './validar';

const esquema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

/** Variables que nunca salen del servidor. */
export function leerEntornoServidor(): z.infer<typeof esquema> {
  return validarEntorno(esquema, {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
}
```

`tests/entorno-pruebas.ts`:

```ts
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { validarEntorno } from '../src/lib/entorno/validar';

const esquema = z.object({
  SUPABASE_REF_PRUEBAS: z.string().min(1),
  CONTRASENA_USUARIOS_PRUEBA: z.string().min(8),
});

/** Carga .env.local en procesos que no son Next.js: scripts y preparacion de tests. */
export function cargarEntornoLocal(): void {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local');
}

/** Variables que solo usan los tests. */
export function leerEntornoPruebas(): z.infer<typeof esquema> {
  return validarEntorno(esquema, {
    SUPABASE_REF_PRUEBAS: process.env.SUPABASE_REF_PRUEBAS,
    CONTRASENA_USUARIOS_PRUEBA: process.env.CONTRASENA_USUARIOS_PRUEBA,
  });
}
```

- [ ] **Step 10: Crear `.env.example`**

```bash
# URL del proyecto de Supabase. En local, la del proyecto de pruebas.
# Se saca de Supabase > Project Settings > API.
NEXT_PUBLIC_SUPABASE_URL=

# Clave publicable (sb_publishable_...). Viaja al navegador: no saltea RLS.
# Se saca de Supabase > Project Settings > API Keys.
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Clave secreta (sb_secret_...). Saltea RLS: nunca se sube ni se comparte.
# Se saca de Supabase > Project Settings > API Keys.
SUPABASE_SECRET_KEY=

# Identificador del proyecto de pruebas. Los tests abortan si la URL no es la de este proyecto.
SUPABASE_REF_PRUEBAS=

# Contraseña de las cuentas de prueba (prueba.<rol>@manteca.test). Minimo 8 caracteres.
CONTRASENA_USUARIOS_PRUEBA=
```

- [ ] **Step 11: Crear `.env.local` con los datos de pruebas**

Con las herramientas MCP de `supabase-pruebas` (nunca las de `supabase` general): `get_project_url` da la URL y `get_publishable_keys` da la clave publicable.

Generar la contraseña de las cuentas de prueba sin mostrarla en la conversación:

```bash
node -e "const fs=require('fs');const c=require('crypto').randomBytes(18).toString('base64url');fs.appendFileSync('.env.local','CONTRASENA_USUARIOS_PRUEBA='+c+'\n')"
```

`.env.local` tiene que quedar con estas cinco líneas, la de la clave secreta vacía:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nrevmkmpaaoobpmgkzhh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<la que devolvió get_publishable_keys>
SUPABASE_SECRET_KEY=
SUPABASE_REF_PRUEBAS=nrevmkmpaaoobpmgkzhh
CONTRASENA_USUARIOS_PRUEBA=<la generada por el comando>
```

Comprobar que git no lo ve:

```bash
git status --porcelain .env.local
```

Expected: sin salida.

- [ ] **Step 12: Pedirle a Santiago la clave secreta**

Frenar y avisarle a Santiago: tiene que abrir `.env.local` y pegar en `SUPABASE_SECRET_KEY=` la clave secreta del proyecto de pruebas (Supabase > Project Settings > API Keys). No se le pide por el chat.

La Tarea 4 no puede empezar hasta que esté cargada. Para comprobarlo sin mostrarla:

```bash
node -e "process.loadEnvFile('.env.local');console.log(process.env.SUPABASE_SECRET_KEY?'cargada':'FALTA')"
```

Expected: `cargada`.

- [ ] **Step 13: Lint, tipos y commit**

Run: `npm run lint && npm run tipos`
Expected: sin errores.

```bash
git add src/lib/entorno/validar.test.ts tests/base-de-pruebas.test.ts
git commit -m "test: validar variables de entorno y comprobar la base de pruebas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/lib/entorno/validar.ts src/lib/entorno/publico.ts src/lib/entorno/servidor.ts tests/base-de-pruebas.ts tests/entorno-pruebas.ts .env.example
git commit -m "feat: valida las variables de entorno y comprueba la base de pruebas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Cuentas de prueba y grupo `base`

**Files:**
- Create: `src/lib/supabase/secreto.ts`
- Create: `tests/cuentas.ts`, `tests/clientes.ts`, `tests/preparar.ts`, `tests/preparacion-base.ts`
- Create: `scripts/sembrar-pruebas.ts`
- Test: `tests/cuentas.base.test.ts`

**Interfaces:**
- Consumes: `leerEntornoPublico`, `leerEntornoServidor`, `leerEntornoPruebas`, `cargarEntornoLocal`, `exigirBaseDePruebas` (Tarea 3). El grupo `base` de Vitest, que ya apunta a `tests/preparacion-base.ts` (Tarea 1).
- Produces:
  - `crearClienteSecreto(): SupabaseClient`
  - `ROLES_DE_PRUEBA`, `type RolDePrueba = 'invitado' | 'caja' | 'encargado' | 'admin' | 'adminOtroLocal' | 'desactivado'`
  - `emailDePrueba(rol: RolDePrueba): string`
  - `sembrarCuentas(cliente: SupabaseClient, contrasena: string): Promise<string[]>`, que devuelve los emails que creó
  - `clienteComo(rol: RolDePrueba): Promise<SupabaseClient>`
  - `prepararBaseDePruebas(): Promise<string[]>`
  - El comando `npm run sembrar:pruebas`

Requisito: `SUPABASE_SECRET_KEY` cargada en `.env.local` (Tarea 3, paso 12).

- [ ] **Step 1: Escribir el test que falla**

`tests/cuentas.base.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { crearClienteSecreto } from '../src/lib/supabase/secreto';
import { clienteComo } from './clientes';
import { ROLES_DE_PRUEBA, emailDePrueba, sembrarCuentas } from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';

describe('cuentas de prueba', () => {
  it('son seis, una por rol', () => {
    expect(ROLES_DE_PRUEBA).toEqual([
      'invitado',
      'caja',
      'encargado',
      'admin',
      'adminOtroLocal',
      'desactivado',
    ]);
  });

  it.each(ROLES_DE_PRUEBA)('la cuenta de %s inicia sesion con la clave publicable', async (rol) => {
    const cliente = await clienteComo(rol);
    const { data, error } = await cliente.auth.getUser();
    expect(error).toBeNull();
    // Supabase guarda el email en minusculas.
    expect(data.user?.email).toBe(emailDePrueba(rol).toLowerCase());
  });

  it('sembrar de nuevo no crea cuentas ni falla', async () => {
    const { CONTRASENA_USUARIOS_PRUEBA } = leerEntornoPruebas();
    const creadas = await sembrarCuentas(crearClienteSecreto(), CONTRASENA_USUARIOS_PRUEBA);
    expect(creadas).toEqual([]);
  });

  it('una contraseña equivocada no entra', async () => {
    const { leerEntornoPublico } = await import('../src/lib/entorno/publico');
    const { createClient } = await import('@supabase/supabase-js');
    const entorno = leerEntornoPublico();
    const cliente = createClient(
      entorno.NEXT_PUBLIC_SUPABASE_URL,
      entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
    const { data, error } = await cliente.auth.signInWithPassword({
      email: emailDePrueba('admin'),
      password: 'no-es-la-contraseña',
    });
    expect(error).not.toBeNull();
    expect(data.session).toBeNull();
  });
});
```

- [ ] **Step 2: Correr el test y verlo fallar**

Run: `npx vitest run --project base`
Expected: FAIL, porque no existe `tests/preparacion-base.ts` ni los módulos que importa el test.

- [ ] **Step 3: Escribir el cliente con la clave secreta**

`src/lib/supabase/secreto.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { leerEntornoPublico } from '../entorno/publico';
import { leerEntornoServidor } from '../entorno/servidor';

/**
 * Unico lugar donde se usa la clave secreta, que saltea RLS.
 * Solo para sembrar y limpiar en tests, procesos automaticos sin usuario
 * y administrar cuentas despues de verificar que lo pide un admin.
 */
export function crearClienteSecreto(): SupabaseClient {
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  const { SUPABASE_SECRET_KEY } = leerEntornoServidor();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 4: Escribir las cuentas y la siembra**

`tests/cuentas.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

export const ROLES_DE_PRUEBA = [
  'invitado',
  'caja',
  'encargado',
  'admin',
  'adminOtroLocal',
  'desactivado',
] as const;

export type RolDePrueba = (typeof ROLES_DE_PRUEBA)[number];

export function emailDePrueba(rol: RolDePrueba): string {
  return `prueba.${rol}@manteca.test`;
}

async function emailsExistentes(cliente: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await cliente.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`No pude listar las cuentas de prueba: ${error.message}`);
  return new Set(data.users.map((usuario) => (usuario.email ?? '').toLowerCase()));
}

async function crearCuenta(cliente: SupabaseClient, email: string, password: string) {
  // email_confirm evita depender de que la confirmacion por mail este apagada.
  const { error } = await cliente.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`No pude crear la cuenta ${email}: ${error.message}`);
}

/** Crea las cuentas de prueba que falten y devuelve los emails que creo. */
export async function sembrarCuentas(cliente: SupabaseClient, contrasena: string): Promise<string[]> {
  const existentes = await emailsExistentes(cliente);
  // Supabase guarda el email en minusculas: se compara asi para no recrear adminOtroLocal.
  const faltantes = ROLES_DE_PRUEBA.map(emailDePrueba).filter(
    (email) => !existentes.has(email.toLowerCase()),
  );
  for (const email of faltantes) {
    await crearCuenta(cliente, email, contrasena);
  }
  return faltantes;
}
```

- [ ] **Step 5: Escribir el cliente firmado como una cuenta de prueba**

`tests/clientes.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { emailDePrueba, type RolDePrueba } from './cuentas';
import { leerEntornoPruebas } from './entorno-pruebas';

/**
 * Cliente con la sesion de una cuenta de prueba, sobre la clave publicable.
 * Es la misma superficie que usa un atacante: asi se prueban los permisos.
 */
export async function clienteComo(rol: RolDePrueba): Promise<SupabaseClient> {
  const entorno = leerEntornoPublico();
  const cliente = createClient(
    entorno.NEXT_PUBLIC_SUPABASE_URL,
    entorno.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await cliente.auth.signInWithPassword({
    email: emailDePrueba(rol),
    password: leerEntornoPruebas().CONTRASENA_USUARIOS_PRUEBA,
  });
  if (error) throw new Error(`No pude entrar como ${rol}: ${error.message}`);
  return cliente;
}
```

- [ ] **Step 6: Escribir la preparación compartida y la de Vitest**

`tests/preparar.ts`:

```ts
import { leerEntornoPublico } from '../src/lib/entorno/publico';
import { crearClienteSecreto } from '../src/lib/supabase/secreto';
import { exigirBaseDePruebas } from './base-de-pruebas';
import { sembrarCuentas } from './cuentas';
import { cargarEntornoLocal, leerEntornoPruebas } from './entorno-pruebas';

/**
 * Lo que corre antes de cualquier test que toque la base, y tambien el comando
 * sembrar:pruebas. Primero comprueba la base: recien despues usa la clave secreta.
 */
export async function prepararBaseDePruebas(): Promise<string[]> {
  cargarEntornoLocal();
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  const pruebas = leerEntornoPruebas();
  exigirBaseDePruebas(NEXT_PUBLIC_SUPABASE_URL, pruebas.SUPABASE_REF_PRUEBAS);
  return sembrarCuentas(crearClienteSecreto(), pruebas.CONTRASENA_USUARIOS_PRUEBA);
}
```

`tests/preparacion-base.ts`:

```ts
import { prepararBaseDePruebas } from './preparar';

export default async function preparacion(): Promise<void> {
  await prepararBaseDePruebas();
}
```

- [ ] **Step 7: Escribir el comando**

`scripts/sembrar-pruebas.ts`:

```ts
import { prepararBaseDePruebas } from '../tests/preparar';

const creadas = await prepararBaseDePruebas();

console.log(
  creadas.length === 0
    ? 'Las cuentas de prueba ya estaban todas.'
    : `Cuentas de prueba creadas: ${creadas.join(', ')}`,
);
```

- [ ] **Step 8: Correr el comando**

Run: `npm run sembrar:pruebas`
Expected: `Cuentas de prueba creadas:` seguido de los seis emails. Si la base está pausada, reactivarla desde Supabase es parte de la tarea.

Run: `npm run sembrar:pruebas`
Expected: `Las cuentas de prueba ya estaban todas.`

- [ ] **Step 9: Correr el test y verlo pasar**

Run: `npx vitest run --project base`
Expected: PASS, 9 tests (uno de la lista, seis de inicio de sesión, uno de volver a sembrar y uno de contraseña equivocada).

- [ ] **Step 10: Comprobar que la preparación aborta fuera de la base de pruebas**

Sin tocar `.env.local`, correr con un identificador distinto:

```bash
SUPABASE_REF_PRUEBAS=otroproyecto npx vitest run --project base
```

Expected: FAIL antes de correr ningún test, con el mensaje `no es la del proyecto de pruebas`. (`process.loadEnvFile` no pisa una variable que ya está definida.)

- [ ] **Step 11: Correr todo Vitest, lint y tipos**

Run: `npm test && npm run lint && npm run tipos`
Expected: los dos grupos en verde y sin errores de lint ni de tipos.

- [ ] **Step 12: Commit**

```bash
git add tests/cuentas.base.test.ts
git commit -m "test: las cuentas de prueba inician sesion y sembrar es repetible

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/lib/supabase/secreto.ts tests/cuentas.ts tests/clientes.ts tests/preparar.ts tests/preparacion-base.ts scripts/sembrar-pruebas.ts
git commit -m "feat: siembra las cuentas de prueba y prepara el grupo base

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Playwright y página provisoria de inicio

**Files:**
- Create: `playwright.config.ts`, `e2e/preparacion.ts`
- Create: `src/app/page.tsx`
- Test: `e2e/inicio.spec.ts`

**Interfaces:**
- Consumes: `prepararBaseDePruebas(): Promise<string[]>` de `tests/preparar.ts` (Tarea 4). El marco `src/app/layout.tsx` (Tarea 1).
- Produces: el comando `npm run e2e` andando, con dos proyectos de Playwright: `computadora` y `celular`. La carpeta `e2e/capturas/` para las capturas, que no se sube.

- [ ] **Step 1: Instalar el navegador de Playwright**

Run: `npx playwright install chromium`
Expected: descarga Chromium o dice que ya está.

- [ ] **Step 2: Crear `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

const URL_LOCAL = 'http://localhost:3000';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/preparacion.ts',
  // Se prueba a la vista y de a un navegador, para que Santiago pueda mirarlo.
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: URL_LOCAL,
    headless: false,
    launchOptions: { slowMo: 300 },
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'computadora', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: URL_LOCAL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Crear la preparación de Playwright**

`e2e/preparacion.ts`:

```ts
import { prepararBaseDePruebas } from '../tests/preparar';

export default async function preparacion(): Promise<void> {
  await prepararBaseDePruebas();
}
```

- [ ] **Step 4: Escribir la prueba que falla**

`e2e/inicio.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('la pagina de inicio muestra el nombre de Manteca', async ({ page }) => {
  const respuesta = await page.goto('/');

  expect(respuesta?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Manteca' })).toBeVisible();
  await expect(page).toHaveTitle('Manteca');
});
```

- [ ] **Step 5: Correr la prueba y verla fallar**

Run: `npm run e2e -- e2e/inicio.spec.ts`
Expected: FAIL en los dos proyectos, con estado 404 en vez de 200, porque `src/app/page.tsx` no existe.

- [ ] **Step 6: Escribir la página**

`src/app/page.tsx`:

```tsx
// Provisoria: el menu publico la reemplaza cuando se construya ese modulo.
export default function PaginaInicio() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl">Manteca</h1>
    </main>
  );
}
```

- [ ] **Step 7: Correr la prueba y verla pasar**

Run: `npm run e2e -- e2e/inicio.spec.ts`
Expected: PASS, 2 tests (uno por proyecto), con la ventana del navegador a la vista.

- [ ] **Step 8: Lint, tipos y commit**

Run: `npm run lint && npm run tipos`
Expected: sin errores.

```bash
git add playwright.config.ts e2e/preparacion.ts e2e/inicio.spec.ts
git commit -m "test: la pagina de inicio muestra el nombre de Manteca

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/app/page.tsx
git commit -m "feat: agrega la pagina de inicio provisoria

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Tokens, componentes base y página de la guía de estilos

**Files:**
- Create: `public/fonts/` (seis archivos), `components.json`, `src/lib/utils.ts`, `src/components/ui/*` (los crea shadcn)
- Modify: `src/app/globals.css` (se reemplaza entero), `src/app/page.tsx` (título con la tipografía de la guía)
- Create: `src/lib/guia/tokens.ts`
- Create: `src/components/guia/SeccionGuia.tsx`, `SeccionColores.tsx`, `SeccionTipografias.tsx`, `SeccionMedidas.tsx`, `SeccionComponentes.tsx`
- Create: `src/app/admin/guia-de-estilos/page.tsx`
- Test: `src/lib/guia/tokens.test.ts`, `e2e/guia-de-estilos.spec.ts`

**Interfaces:**
- Consumes: `formatearPesos(centavos: number): string` (Tarea 1). Los proyectos `computadora` y `celular` de Playwright (Tarea 5).
- Produces: los tokens de `globals.css` (colores, tipografías, radios, sombras) como clases de Tailwind: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, `bg-accent`, `font-title`, `font-sans`, `rounded-lg`, `shadow-suave`, `shadow-media`, `shadow-alta`. Los componentes `Button`, `Input`, `Label`, `Card`, `Table`, `Alert` y `Badge` en `@/components/ui/`. La página `/admin/guia-de-estilos`.

- [ ] **Step 1: Copiar las tipografías**

Los archivos están en el repo de la página actual, que es otra carpeta del mismo equipo. Se copian seis, sin los duplicados ni las itálicas:

```bash
mkdir -p public/fonts
ORIGEN="../Pagina Manteca/manteca-menu-reimagined/public/fonts"
cp "$ORIGEN/MANIC.otf" public/fonts/
cp "$ORIGEN/NeufileGrotesk-Light.ttf" "$ORIGEN/NeufileGrotesk-Regular.ttf" "$ORIGEN/NeufileGrotesk-Medium.ttf" "$ORIGEN/NeufileGrotesk-SemiBold.ttf" "$ORIGEN/NeufileGrotesk-Bold.ttf" public/fonts/
ls public/fonts
```

Expected: seis archivos. Si la carpeta de origen no existe, frenar y avisarle a Santiago: las tipografías no se bajan de internet.

- [ ] **Step 2: Inicializar shadcn y sumar los componentes base**

```bash
npx shadcn@latest init --yes --base-color neutral
npx shadcn@latest add --yes button input label card table alert badge
```

Si la versión instalada de shadcn no acepta esas opciones, `npx shadcn@latest init --help` muestra las actuales; se eligen las equivalentes (sin preguntas, color base neutro, carpeta `src/`).

Expected: crea `components.json`, `src/lib/utils.ts` y siete archivos en `src/components/ui/`, e instala sus dependencias. Shadcn reescribe `src/app/globals.css` con su paleta: el paso 6 lo reemplaza entero.

Fijar las versiones que shadcn instaló con rango:

```bash
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));const l=JSON.parse(fs.readFileSync('package-lock.json','utf8'));for(const g of ['dependencies','devDependencies'])for(const n of Object.keys(p[g]||{}))p[g][n]=l.packages['node_modules/'+n].version;fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n')"
npm install
grep -E '"[\^~]' package.json
```

Expected: el `grep` no devuelve nada.

- [ ] **Step 3: Escribir el test de los tokens, que falla**

Este test mantiene la guía sincronizada con los tokens: si la guía nombra un token que `globals.css` no define, falla.

`src/lib/guia/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLORES, ESPACIADOS, RADIOS, SOMBRAS, TIPOGRAFIAS } from './tokens';

const css = readFileSync('src/app/globals.css', 'utf8');

function estaDefinida(variable: string): boolean {
  return new RegExp(`${variable}\\s*:`).test(css);
}

describe('tokens de la guia de estilos', () => {
  it.each([...COLORES, ...RADIOS, ...SOMBRAS, ...TIPOGRAFIAS])(
    '$nombre usa una variable definida en globals.css',
    ({ variable }) => {
      expect(estaDefinida(variable)).toBe(true);
    },
  );

  it('no repite nombres', () => {
    const nombres = [...COLORES, ...RADIOS, ...SOMBRAS, ...TIPOGRAFIAS].map((t) => t.nombre);
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it('muestra la paleta completa de Manteca', () => {
    expect(COLORES.map((color) => color.variable)).toEqual([
      '--background',
      '--foreground',
      '--card',
      '--primary',
      '--secondary',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--destructive',
      '--border',
    ]);
  });

  it('los espaciados son pasos enteros de la escala', () => {
    expect(ESPACIADOS).toEqual([1, 2, 3, 4, 6, 8, 12, 16]);
  });
});
```

- [ ] **Step 4: Correr el test y verlo fallar**

Run: `npx vitest run --project puros src/lib/guia/tokens.test.ts`
Expected: FAIL, porque no se puede resolver `./tokens`.

- [ ] **Step 5: Escribir la lista de tokens**

`src/lib/guia/tokens.ts`:

```ts
export type Token = { nombre: string; variable: string };

export const COLORES: readonly Token[] = [
  { nombre: 'Fondo', variable: '--background' },
  { nombre: 'Texto', variable: '--foreground' },
  { nombre: 'Tarjeta', variable: '--card' },
  { nombre: 'Primario', variable: '--primary' },
  { nombre: 'Secundario', variable: '--secondary' },
  { nombre: 'Apagado', variable: '--muted' },
  { nombre: 'Texto apagado', variable: '--muted-foreground' },
  { nombre: 'Acento', variable: '--accent' },
  { nombre: 'Destructivo', variable: '--destructive' },
  { nombre: 'Borde', variable: '--border' },
];

export const TIPOGRAFIAS: readonly Token[] = [
  { nombre: 'Manic, para títulos', variable: '--font-family-title' },
  { nombre: 'Neufile Grotesk, para texto', variable: '--font-family-sans' },
];

export const RADIOS: readonly Token[] = [
  { nombre: 'Radio chico', variable: '--radio-chico' },
  { nombre: 'Radio medio', variable: '--radio-medio' },
  { nombre: 'Radio grande', variable: '--radio-grande' },
  { nombre: 'Radio extra grande', variable: '--radio-extra' },
];

export const SOMBRAS: readonly Token[] = [
  { nombre: 'Sombra suave', variable: '--sombra-suave' },
  { nombre: 'Sombra media', variable: '--sombra-media' },
  { nombre: 'Sombra alta', variable: '--sombra-alta' },
];

/** Pasos de la escala de Tailwind que usa la aplicacion (cada uno vale 0,25 rem). */
export const ESPACIADOS: readonly number[] = [1, 2, 3, 4, 6, 8, 12, 16];
```

- [ ] **Step 6: Reemplazar `src/app/globals.css` con los tokens de Manteca**

Los valores de color, tipografía y radio son los de `styles.css` de la página actual. Las sombras se definen acá.

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@font-face {
  font-family: 'Neufile Grotesk';
  src: url('/fonts/NeufileGrotesk-Light.ttf') format('truetype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Neufile Grotesk';
  src: url('/fonts/NeufileGrotesk-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Neufile Grotesk';
  src: url('/fonts/NeufileGrotesk-Medium.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Neufile Grotesk';
  src: url('/fonts/NeufileGrotesk-SemiBold.ttf') format('truetype');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Neufile Grotesk';
  src: url('/fonts/NeufileGrotesk-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Manic';
  src: url('/fonts/MANIC.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@theme inline {
  --radius-sm: var(--radio-chico);
  --radius-md: var(--radio-medio);
  --radius-lg: var(--radio-grande);
  --radius-xl: var(--radio-extra);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --font-title: var(--font-family-title);
  --font-sans: var(--font-family-sans);

  --shadow-suave: var(--sombra-suave);
  --shadow-media: var(--sombra-media);
  --shadow-alta: var(--sombra-alta);
}

:root {
  --radius: 0.75rem;
  --font-family-title: 'Manic', sans-serif;
  --font-family-sans: 'Neufile Grotesk', sans-serif;

  --background: oklch(0.955 0.015 85);
  --foreground: oklch(0.22 0.035 45);
  --card: oklch(0.985 0.008 85);
  --card-foreground: oklch(0.22 0.035 45);
  --popover: oklch(0.98 0.01 85);
  --popover-foreground: oklch(0.22 0.035 45);
  --primary: oklch(0.32 0.065 45);
  --primary-foreground: oklch(0.97 0.008 75);
  --secondary: oklch(0.935 0.018 85);
  --secondary-foreground: oklch(0.32 0.065 45);
  --muted: oklch(0.92 0.015 85);
  --muted-foreground: oklch(0.5 0.03 55);
  --accent: #bfa042;
  --accent-foreground: white;
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.984 0.003 247.858);
  --border: oklch(0.88 0.02 85);
  --input: oklch(0.88 0.02 85);
  --ring: #bfa042;

  /* Radios y sombras se definen aca y no solo en @theme: Tailwind emite
     unicamente las variables de tema que alguna clase usa, y la guia las
     muestra todas. */
  --radio-chico: calc(var(--radius) - 4px);
  --radio-medio: calc(var(--radius) - 2px);
  --radio-grande: var(--radius);
  --radio-extra: calc(var(--radius) + 4px);

  --sombra-suave: 0 1px 2px oklch(0.4 0.05 60 / 8%);
  --sombra-media: 0 8px 30px -12px oklch(0.4 0.05 60 / 15%);
  --sombra-alta: 0 16px 40px -16px oklch(0.4 0.05 60 / 25%);
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-family-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
```

- [ ] **Step 7: Correr el test de los tokens y verlo pasar**

Run: `npx vitest run --project puros src/lib/guia/tokens.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit de tokens y componentes base**

```bash
git add public/fonts/MANIC.otf public/fonts/NeufileGrotesk-Light.ttf public/fonts/NeufileGrotesk-Regular.ttf public/fonts/NeufileGrotesk-Medium.ttf public/fonts/NeufileGrotesk-SemiBold.ttf public/fonts/NeufileGrotesk-Bold.ttf
git add components.json package.json package-lock.json src/lib/utils.ts src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/label.tsx src/components/ui/card.tsx src/components/ui/table.tsx src/components/ui/alert.tsx src/components/ui/badge.tsx
git commit -m "chore: suma las tipografias de Manteca y los componentes base de shadcn

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/lib/guia/tokens.test.ts
git commit -m "test: la guia solo nombra tokens definidos en globals.css

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/lib/guia/tokens.ts src/app/globals.css
git commit -m "feat: define los tokens de diseño con la identidad de Manteca

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 9: Escribir la prueba en vivo de la guía, que falla**

`e2e/guia-de-estilos.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const SECCIONES = ['Colores', 'Tipografías', 'Radios', 'Sombras', 'Espaciados', 'Componentes'];

const COLORES = [
  'Fondo',
  'Texto',
  'Tarjeta',
  'Primario',
  'Secundario',
  'Apagado',
  'Texto apagado',
  'Acento',
  'Destructivo',
  'Borde',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/admin/guia-de-estilos');
});

test('muestra el titulo y todas las secciones', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Guía de estilos' })).toBeVisible();
  for (const seccion of SECCIONES) {
    await expect(page.getByRole('heading', { level: 2, name: seccion })).toBeVisible();
  }
});

test('muestra cada color con su nombre y su variable', async ({ page }) => {
  const colores = page.getByRole('region', { name: 'Colores' });
  for (const color of COLORES) {
    await expect(colores.getByText(color, { exact: true })).toBeVisible();
  }
  await expect(colores.getByText('--accent', { exact: true })).toBeVisible();
});

test('carga las dos tipografias de Manteca', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const cargadas = await page.evaluate(() => ({
    manic: document.fonts.check('16px "Manic"'),
    neufile: document.fonts.check('16px "Neufile Grotesk"'),
  }));
  expect(cargadas).toEqual({ manic: true, neufile: true });
});

test('el titulo usa Manic y el texto usa Neufile Grotesk', async ({ page }) => {
  const titulo = page.getByRole('heading', { level: 1, name: 'Guía de estilos' });
  await expect(titulo).toHaveCSS('font-family', /Manic/);
  await expect(page.locator('body')).toHaveCSS('font-family', /Neufile Grotesk/);
});

test('muestra los componentes base', async ({ page }) => {
  const componentes = page.getByRole('region', { name: 'Componentes' });
  await expect(componentes.getByRole('button', { name: 'Guardar' })).toBeVisible();
  await expect(componentes.getByRole('button', { name: 'Anular' })).toBeVisible();
  await expect(componentes.getByRole('button', { name: 'No disponible' })).toBeDisabled();
  await expect(componentes.getByLabel('Nombre')).toBeEditable();
  await expect(componentes.getByRole('table')).toBeVisible();
  await expect(componentes.getByRole('alert')).toContainText('Revisá los montos');
  await expect(componentes.getByText('Más vendido', { exact: true })).toBeVisible();
});

test('muestra la plata con el formato del sistema', async ({ page }) => {
  const tabla = page.getByRole('region', { name: 'Componentes' }).getByRole('table');
  await expect(tabla.getByRole('cell', { name: '$1.234,50' })).toBeVisible();
});

test('se puede escribir en el campo de ejemplo', async ({ page }) => {
  const campo = page.getByRole('region', { name: 'Componentes' }).getByLabel('Nombre');
  await campo.fill('Medialuna');
  await expect(campo).toHaveValue('Medialuna');
});

test('no desborda a lo ancho', async ({ page }) => {
  const desborde = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(desborde).toBeLessThanOrEqual(0);
});

test('no la indexan los buscadores', async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('guarda una captura para revisarla', async ({ page }, info) => {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `e2e/capturas/guia-${info.project.name}.png`, fullPage: true });
});
```

- [ ] **Step 10: Correr la prueba y verla fallar**

Run: `npm run e2e -- e2e/guia-de-estilos.spec.ts`
Expected: FAIL en los dos proyectos, porque `/admin/guia-de-estilos` responde 404 y no se encuentra el título.

- [ ] **Step 11: Escribir el marco de una sección**

`src/components/guia/SeccionGuia.tsx`:

```tsx
import type { ReactNode } from 'react';

type Props = { titulo: string; children: ReactNode };

/** Una seccion de la guia. El aria-label permite ubicarla por su titulo. */
export function SeccionGuia({ titulo, children }: Props) {
  return (
    <section aria-label={titulo} className="space-y-4">
      <h2 className="font-title text-2xl">{titulo}</h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 12: Escribir las secciones de colores y de tipografías**

`src/components/guia/SeccionColores.tsx`:

```tsx
import { COLORES } from '@/lib/guia/tokens';
import { SeccionGuia } from './SeccionGuia';

export function SeccionColores() {
  return (
    <SeccionGuia titulo="Colores">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {COLORES.map((color) => (
          <li key={color.variable} className="space-y-2">
            <div
              className="h-16 rounded-lg border"
              style={{ backgroundColor: `var(${color.variable})` }}
            />
            <p className="text-sm font-medium">{color.nombre}</p>
            <p className="text-muted-foreground text-xs">{color.variable}</p>
          </li>
        ))}
      </ul>
    </SeccionGuia>
  );
}
```

`src/components/guia/SeccionTipografias.tsx`:

```tsx
import { TIPOGRAFIAS } from '@/lib/guia/tokens';
import { SeccionGuia } from './SeccionGuia';

const TAMANOS = ['text-sm', 'text-base', 'text-xl', 'text-3xl'] as const;

export function SeccionTipografias() {
  return (
    <SeccionGuia titulo="Tipografías">
      <ul className="space-y-6">
        {TIPOGRAFIAS.map((tipografia) => (
          <li key={tipografia.variable} className="space-y-2">
            <p className="text-muted-foreground text-xs">{tipografia.nombre}</p>
            {TAMANOS.map((tamano) => (
              <p
                key={tamano}
                className={tamano}
                style={{ fontFamily: `var(${tipografia.variable})` }}
              >
                El sabor de lo real
              </p>
            ))}
          </li>
        ))}
      </ul>
    </SeccionGuia>
  );
}
```

- [ ] **Step 13: Escribir las secciones de radios, sombras y espaciados**

Van las tres en un archivo porque comparten el mismo dibujo: una caja con una medida.

`src/components/guia/SeccionMedidas.tsx`:

```tsx
import type { CSSProperties } from 'react';
import { ESPACIADOS, RADIOS, SOMBRAS, type Token } from '@/lib/guia/tokens';
import { SeccionGuia } from './SeccionGuia';

type PropsCajas = { tokens: readonly Token[]; estilo: (variable: string) => CSSProperties };

function Cajas({ tokens, estilo }: PropsCajas) {
  return (
    <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {tokens.map((token) => (
        <li key={token.variable} className="space-y-2">
          <div className="bg-card h-16 border" style={estilo(`var(${token.variable})`)} />
          <p className="text-sm font-medium">{token.nombre}</p>
          <p className="text-muted-foreground text-xs">{token.variable}</p>
        </li>
      ))}
    </ul>
  );
}

export function SeccionRadios() {
  return (
    <SeccionGuia titulo="Radios">
      <Cajas tokens={RADIOS} estilo={(valor) => ({ borderRadius: valor })} />
    </SeccionGuia>
  );
}

export function SeccionSombras() {
  return (
    <SeccionGuia titulo="Sombras">
      <Cajas
        tokens={SOMBRAS}
        estilo={(valor) => ({ boxShadow: valor, borderRadius: 'var(--radio-grande)' })}
      />
    </SeccionGuia>
  );
}

export function SeccionEspaciados() {
  return (
    <SeccionGuia titulo="Espaciados">
      <ul className="space-y-2">
        {ESPACIADOS.map((paso) => (
          <li key={paso} className="flex items-center gap-4">
            <span className="text-muted-foreground w-8 text-xs">{paso}</span>
            <div className="bg-primary h-3" style={{ width: `calc(var(--spacing) * ${paso})` }} />
          </li>
        ))}
      </ul>
    </SeccionGuia>
  );
}
```

- [ ] **Step 14: Escribir la sección de componentes**

`src/components/guia/SeccionComponentes.tsx`:

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatearPesos } from '@/lib/plata';
import { SeccionGuia } from './SeccionGuia';

function Botones() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button>Guardar</Button>
      <Button variant="secondary">Cancelar</Button>
      <Button variant="outline">Ver detalle</Button>
      <Button variant="destructive">Anular</Button>
      <Button disabled>No disponible</Button>
    </div>
  );
}

function TablaDeEjemplo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead className="text-right">Precio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Medialuna XL</TableCell>
          <TableCell className="text-right">{formatearPesos(123450)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export function SeccionComponentes() {
  return (
    <SeccionGuia titulo="Componentes">
      <div className="space-y-8">
        <Botones />
        <div className="max-w-sm space-y-2">
          <Label htmlFor="guia-nombre">Nombre</Label>
          <Input id="guia-nombre" placeholder="Escribí un nombre" />
        </div>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Tarjeta</CardTitle>
          </CardHeader>
          <CardContent>Así se ve el contenido de una tarjeta.</CardContent>
        </Card>
        <TablaDeEjemplo />
        <Alert variant="destructive">
          <AlertTitle>No pudimos guardar el cierre</AlertTitle>
          <AlertDescription>Revisá los montos e intentá de nuevo.</AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Badge>Más vendido</Badge>
          <Badge variant="secondary">Artesanal</Badge>
          <Badge variant="outline">Nuevo</Badge>
        </div>
      </div>
    </SeccionGuia>
  );
}
```

Si la versión instalada de shadcn nombra distinto una variante (`secondary`, `outline`, `destructive`), usar el nombre que traiga el archivo generado en `src/components/ui/`; no se edita el componente para forzar un nombre.

- [ ] **Step 15: Escribir la página**

`src/app/admin/guia-de-estilos/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { SeccionColores } from '@/components/guia/SeccionColores';
import { SeccionComponentes } from '@/components/guia/SeccionComponentes';
import { SeccionEspaciados, SeccionRadios, SeccionSombras } from '@/components/guia/SeccionMedidas';
import { SeccionTipografias } from '@/components/guia/SeccionTipografias';

export const metadata: Metadata = {
  title: 'Guía de estilos',
  robots: { index: false, follow: false },
};

export default function PaginaGuiaDeEstilos() {
  return (
    <main className="mx-auto max-w-5xl space-y-12 px-4 py-8">
      <header className="space-y-2">
        <h1 className="font-title text-4xl">Guía de estilos</h1>
        <p className="text-muted-foreground">
          Colores, tipografías, medidas y componentes que usa toda la aplicación.
        </p>
      </header>
      <SeccionColores />
      <SeccionTipografias />
      <SeccionRadios />
      <SeccionSombras />
      <SeccionEspaciados />
      <SeccionComponentes />
    </main>
  );
}
```

- [ ] **Step 16: Usar la tipografía de títulos en la página provisoria**

En `src/app/page.tsx`, cambiar la línea del título:

```tsx
      <h1 className="font-title text-4xl">Manteca</h1>
```

- [ ] **Step 17: Correr la prueba y verla pasar**

Run: `npm run e2e -- e2e/guia-de-estilos.spec.ts`
Expected: PASS, 20 tests (10 por proyecto).

- [ ] **Step 18: Mirar las capturas**

Abrir con la herramienta Read `e2e/capturas/guia-computadora.png` y `e2e/capturas/guia-celular.png`, y revisar: que los títulos estén en Manic y el texto en Neufile Grotesk, que el fondo sea crema y el botón principal marrón, que la tabla no se corte en el celular, y que no haya textos solapados.

Si algo se ve mal, se corrige en los tokens o en la sección que corresponda y se vuelve a correr el paso 17.

- [ ] **Step 19: Lint, tipos, Vitest y commit**

Run: `npm run lint && npm run tipos && npm test`
Expected: sin errores.

```bash
git add e2e/guia-de-estilos.spec.ts
git commit -m "test: la guia de estilos muestra tokens y componentes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/components/guia/SeccionGuia.tsx src/components/guia/SeccionColores.tsx src/components/guia/SeccionTipografias.tsx src/components/guia/SeccionMedidas.tsx src/components/guia/SeccionComponentes.tsx src/app/admin/guia-de-estilos/page.tsx src/app/page.tsx
git commit -m "feat: agrega la pagina de la guia de estilos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Cierre

**Files:**
- Modify: `PEDIDOS.md`
- Modify: `.claude/skills/tests-rls/SKILL.md` (el ejemplo de `clienteComo`)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: el pedido 19 cerrado y el pull request abierto.

- [ ] **Step 1: Correr `npm run verificar`**

Run: `npm run verificar`
Expected: lint, tipos, los dos grupos de Vitest y el build terminan sin errores. Si el build se queja por una variable de entorno, se corrige el código que la lee al importar: ninguna se lee al cargar un módulo, solo dentro de funciones.

- [ ] **Step 2: Correr `npm run e2e` entero**

Run: `npm run e2e`
Expected: PASS, 22 tests (11 por proyecto), con el navegador a la vista.

- [ ] **Step 3: Comprobar que no se sube nada sensible**

```bash
git status --porcelain
git ls-files | grep -E '\.env\.local|capturas|test-results|playwright-report'
git grep -n -E 'sb_secret_|SUPABASE_SECRET_KEY=.+' -- . ':!.env.example'
```

Expected: el primero no muestra `.env.local`; el segundo y el tercero no devuelven nada.

- [ ] **Step 4: Alinear el ejemplo de `tests-rls` con el código real**

En `.claude/skills/tests-rls/SKILL.md`, el bloque de código que empieza con `// tests/rls/clientes.ts` se reemplaza por el contenido real de `tests/clientes.ts` (Tarea 4, paso 5), con la primera línea `// tests/clientes.ts — cliente firmado como una cuenta de prueba.` En el ejemplo de `gastos` de la misma skill, cambiar `import { clienteComo } from './clientes';` por `import { clienteComo } from '../clientes';`.

La nota de esa skill que dice que los ejemplos todavía no corrieron contra una base real se deja: `clienteComo` ya corrió, pero el ejemplo de `gastos` no, porque todavía no hay tablas.

- [ ] **Step 5: Correr la skill `pre-finish`**

Seguir sus pasos completos, junto con `superpowers:verification-before-completion`. Nada se afirma sin la salida del comando a la vista.

- [ ] **Step 6: Actualizar `PEDIDOS.md`**

Pasar a "Completados", con la fecha del día y cómo se verificó (`npm run verificar` y `npm run e2e` en verde; capturas de la guía revisadas en computadora y en celular):

- **19**, Armado del sistema.
- **14**, Descargar y configurar Playwright: quedó instalado dentro del proyecto.
- **6**, Tests reales contra la base de pruebas: existe la primera suite corriendo contra ella.
- **7**, Guía de estilos dentro de la aplicación: existe la página.
- **2**, Base de datos: existe `.env.local` con los datos de pruebas.

- [ ] **Step 7: Commit, push y pull request**

```bash
git add PEDIDOS.md .claude/skills/tests-rls/SKILL.md
git commit -m "docs: cierra el armado del sistema y alinea el ejemplo de tests-rls

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/base-tecnica
```

Seguir `superpowers:finishing-a-development-branch` con la opción de crear el pull request contra `main`. El merge se hace con `gh pr merge --merge`, recién con el OK de Santiago.
