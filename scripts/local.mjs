import { spawnSync, spawn } from 'node:child_process';

// next dev compila cada seccion recien cuando se la pide: aca se arma todo de una y se sirve
// como en produccion, contra la base de pruebas. No recarga solo: tras un cambio se vuelve a correr.
process.loadEnvFile('.env.local');
// Su propia carpeta: no pisa la de next dev (.next) ni la de Playwright (.next-e2e).
process.env.NEXT_DIST_DIR = '.next-local';

const next = 'node_modules/next/dist/bin/next';
const armado = spawnSync(process.execPath, [next, 'build'], { stdio: 'inherit' });
if (armado.status !== 0) process.exit(armado.status ?? 1);

// El mismo puerto que next dev: se usa uno u otro. PUERTO_LOCAL lo cambia.
const puerto = process.env.PUERTO_LOCAL ?? '3210';
const servidor = spawn(process.execPath, [next, 'start', '--port', puerto], { stdio: 'inherit' });
servidor.on('exit', (codigo) => process.exit(codigo ?? 0));
