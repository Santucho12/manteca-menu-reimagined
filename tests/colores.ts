// Contraste entre colores de la guia, segun la formula de WCAG. Solo para los tests.
type Rgb = [number, number, number];

const lineal = (canal: number): number =>
  canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
const comprimido = (canal: number): number =>
  canal <= 0.0031308 ? 12.92 * canal : 1.055 * canal ** (1 / 2.4) - 0.055;
const recortado = (canal: number): number => Math.min(1, Math.max(0, canal));

function desdeOklch(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const lm = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sm = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    recortado(4.0767416621 * lm - 3.3077115913 * mm + 0.2309699292 * sm),
    recortado(-1.2684380046 * lm + 2.6097574011 * mm - 0.3413193965 * sm),
    recortado(-0.0041960863 * lm - 0.7034186147 * mm + 1.707614701 * sm),
  ];
}

function desdeHex(hex: string): Rgb {
  const canal = (inicio: number) => lineal(parseInt(hex.slice(inicio, inicio + 2), 16) / 255);
  return [canal(1), canal(3), canal(5)];
}

/** Un color de la guia (oklch, #rrggbb o white) en sRGB lineal. */
export function colorLineal(valor: string): Rgb {
  const oklch = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(valor.trim());
  if (oklch) return desdeOklch(Number(oklch[1]), Number(oklch[2]), Number(oklch[3]));
  if (/^#[0-9a-f]{6}$/i.test(valor.trim())) return desdeHex(valor.trim());
  if (valor.trim() === 'white') return [1, 1, 1];
  throw new Error(`No se leer el color: ${valor}`);
}

/** Un color con transparencia, apoyado sobre un fondo: el navegador mezcla en sRGB comprimido. */
export function sobreFondo(frente: string, fondo: string, opacidad: number): Rgb {
  const [f, b] = [colorLineal(frente).map(comprimido), colorLineal(fondo).map(comprimido)];
  return f.map((canal, i) => lineal(opacidad * canal + (1 - opacidad) * (b[i] ?? 0))) as Rgb;
}

function luminancia([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste entre dos colores, de 1 a 21. */
export function contraste(a: string | Rgb, b: string | Rgb): number {
  const [la, lb] = [a, b].map((color) =>
    luminancia(typeof color === 'string' ? colorLineal(color) : color),
  ) as [number, number];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Los tokens que define :root en una hoja de estilos. */
export function tokensDe(css: string): Map<string, string> {
  const inicio = css.indexOf(':root {');
  const bloque = css.slice(inicio, css.indexOf('}', inicio));
  return new Map([...bloque.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
}
