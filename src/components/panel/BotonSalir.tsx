import { LogOut } from 'lucide-react';

/** "Salir" (Plan Reminder Pro dice "Cerrar sesion"; las pruebas buscan "Salir"), con POST. */
export function BotonSalir({ variante }: { variante: 'lateral' | 'barra' }) {
  return (
    <form action="/admin/salir" method="post">
      {variante === 'lateral' ? (
        <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300">
          <LogOut size={20} />
          Salir
        </button>
      ) : (
        <button
          aria-label="Salir"
          className="h-9 w-9 rounded-xl text-muted-foreground flex items-center justify-center"
        >
          <LogOut size={18} />
        </button>
      )}
    </form>
  );
}
