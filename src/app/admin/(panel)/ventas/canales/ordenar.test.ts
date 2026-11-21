import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Los tipos de venta se ordenan arrastrando, o con las flechas del teclado (pedido 102).
const leer = (ruta: string) => readFileSync(ruta, 'utf8');

describe('ordenar los tipos de venta', () => {
  it('la lista se arrastra desde la manija de cada fila', () => {
    const lista = leer('src/app/admin/(panel)/ventas/canales/ListaOrdenable.tsx');
    expect(lista).toContain('<Reorder.Group');
    expect(lista).toContain('dragListener={false}');
    expect(lista).toContain('aria-label={`Mover ${canal.nombre}`}');
    expect(lista).toContain("evento.key === 'ArrowUp'");
  });

  it('guarda el orden nuevo con la acción del panel', () => {
    expect(leer('src/app/admin/(panel)/ventas/canales/ListaOrdenable.tsx')).toContain(
      'ordenarCanalesDesdeElPanel(',
    );
    expect(leer('src/app/admin/(panel)/ventas/acciones.ts')).toContain(
      'export async function ordenarCanalesDesdeElPanel',
    );
    expect(leer('src/lib/ventas/escritura.ts')).toContain("rpc('ventas_ordenar_canales'");
  });

  it('la sesión del admin puede cambiar el orden', () => {
    const migracion = leer('supabase/migrations/20261120120000_orden_de_los_tipos_de_venta.sql');
    expect(migracion).toContain(
      'grant update (orden) on table public.canales_de_venta to authenticated',
    );
  });

  it('la lista y Vender salen en el orden guardado', () => {
    expect(leer('src/lib/ventas/consultas.ts')).toContain(".order('orden')");
    const migracion = leer('supabase/migrations/20261120120000_orden_de_los_tipos_de_venta.sql');
    expect(migracion).toContain('order by c.orden');
  });
});
