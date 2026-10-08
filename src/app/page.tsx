import type { Metadata } from 'next';
import { connection } from 'next/server';
import { BloqueFinal } from '@/components/menu-publico/BloqueFinal';
import { NavegacionDeCategorias } from '@/components/menu-publico/NavegacionDeCategorias';
import { Pie } from '@/components/menu-publico/Pie';
import { Portada } from '@/components/menu-publico/Portada';
import { SeccionDelMenu } from '@/components/menu-publico/SeccionDelMenu';
import { leerEntornoPublico } from '@/lib/entorno/publico';
import { leerMenuPublico } from '@/lib/menu/consultas';
import { crearClienteSinSesion } from '@/lib/supabase/sin-sesion';

const DESCRIPCION =
  'El sabor de lo real. Masa madre, harinas orgánicas y 100% manteca. Menú digital de Manteca.';

export const metadata: Metadata = {
  title: 'Manteca — Panadería Artesanal',
  description: DESCRIPCION,
  openGraph: { title: 'Manteca — Panadería Artesanal', description: DESCRIPCION },
};

export default async function PaginaDelMenu() {
  // Cada pedido lee la base: un precio que cambia el admin se ve al recargar.
  await connection();
  const categorias = await leerMenuPublico(crearClienteSinSesion());
  const { NEXT_PUBLIC_SUPABASE_URL } = leerEntornoPublico();
  return (
    <div className="bg-background min-h-screen">
      <Portada />
      <NavegacionDeCategorias
        enlaces={categorias.map(({ ancla, nombre, icono }) => ({ ancla, nombre, icono }))}
      />
      <main id="menu" className="scroll-mt-20 pb-24">
        {categorias.length === 0 ? (
          <p className="text-muted-foreground px-4 py-24 text-center">
            Estamos actualizando el menú.
          </p>
        ) : (
          categorias.map((categoria, i) => (
            <SeccionDelMenu
              key={categoria.id}
              categoria={categoria}
              urlDeSupabase={NEXT_PUBLIC_SUPABASE_URL}
              alternada={i % 2 === 1}
            />
          ))
        )}
      </main>
      <BloqueFinal />
      <Pie anio={new Date().getFullYear()} />
    </div>
  );
}
