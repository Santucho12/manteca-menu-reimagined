import type { NextConfig } from 'next';

const configuracion: NextConfig = {
  // El indicador de desarrollo flota sobre la pagina: tapa contenido en las
  // capturas y puede atajar un clic de Playwright. Los errores se siguen viendo.
  devIndicators: false,
};

export default configuracion;
