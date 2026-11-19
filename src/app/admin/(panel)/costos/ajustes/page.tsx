import { Percent } from 'lucide-react';
import type { Metadata } from 'next';
import { EnlaceDeVolver } from '@/components/panel/EnlaceDeVolver';
import { Pantalla } from '@/components/panel/Pantalla';
import { Seccion } from '@/components/panel/Seccion';
import { exigirPaginaYLeer } from '@/lib/acceso/servidor';
import {
  margenesDelLocal,
  presentacionesParaAjustar,
  type CategoriaParaAjustar,
} from '@/lib/costos/consultas';
import { montoParaEditar } from '@/lib/gastos/plata';
import { contenidoParaEditar } from '@/lib/materia-prima/esquemas';
import { FormularioDeMargenes, FormularioDeUnidades } from './Formularios';

export const metadata: Metadata = { title: 'Ajustes de costos' };

function Categoria({ categoria }: { categoria: CategoriaParaAjustar }) {
  return (
    <Seccion titulo={categoria.nombre} forma="lista">
      <p className="text-xs text-muted-foreground">
        Cambiar una presentación cambia el costo de todos los productos de {categoria.nombre}.
      </p>
      <div className="space-y-2">
        {categoria.presentaciones.map((p) => (
          <FormularioDeUnidades
            key={p.id}
            presentacionId={p.id}
            nombre={`${categoria.nombre} · ${p.nombre}`}
            inicial={{
              unidades: p.unidades === null ? '' : contenidoParaEditar(p.unidades),
              agregado: p.agregadoCentavos === 0 ? '' : montoParaEditar(p.agregadoCentavos),
            }}
          />
        ))}
      </div>
    </Seccion>
  );
}

export default async function AjustesDeCostos() {
  const { datos } = await exigirPaginaYLeer('admin', (c) =>
    Promise.all([margenesDelLocal(c), presentacionesParaAjustar(c)]),
  );
  const [margenes, categorias] = datos;
  return (
    <Pantalla
      titulo="Ajustes de costos"
      subtitulo="Lo que querés ganar y cuántas unidades lleva cada presentación."
      ayuda="costos"
    >
      <Seccion titulo="Márgenes" icono={<Percent className="text-primary" size={24} />}>
        <FormularioDeMargenes inicial={margenes} />
      </Seccion>
      {categorias.map((categoria) => (
        <Categoria key={categoria.id} categoria={categoria} />
      ))}
      <EnlaceDeVolver href="/admin/costos">Volver a costos</EnlaceDeVolver>
    </Pantalla>
  );
}
