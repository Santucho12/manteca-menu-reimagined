import type { NextConfig } from 'next';

const configuracion: NextConfig = {
  // Next no deja dos `next dev` en la misma carpeta: Playwright compila en la suya.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // El indicador de desarrollo flota sobre la pagina: tapa contenido en las
  // capturas y puede atajar un clic de Playwright. Los errores se siguen viendo.
  devIndicators: false,
  // Las fotos que sube el admin se sirven desde el bucket publico de Supabase.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/fotos-del-menu/**',
      },
    ],
  },
  experimental: {
    // Volver a una seccion vista hace menos de 30 s la muestra sin pedirla de nuevo: cada pedido
    // espera el viaje hasta la base (pedido 74). Guardar algo la vacia igual, porque las acciones
    // llaman a revalidatePath('/admin', 'layout').
    staleTimes: { dynamic: 30 },
  },
};

export default configuracion;
