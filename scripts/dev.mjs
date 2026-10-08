import { spawn } from 'node:child_process';

// next dev lee antes .env.development.local que .env.local, pero no pisa lo que ya trae el
// proceso: se carga .env.local aca para que la aplicacion apunte siempre a la base de pruebas.
// No sirve `node --env-file`: Next.js pasa los argumentos de Node por NODE_OPTIONS, y ahi esa
// opcion no esta permitida.
process.loadEnvFile('.env.local');

const servidor = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--port', '3210'],
  { stdio: 'inherit' },
);

servidor.on('exit', (codigo) => process.exit(codigo ?? 0));
