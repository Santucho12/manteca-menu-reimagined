import { LogOut } from 'lucide-react';

/** "Salir" (Plan Reminder Pro dice "Cerrar sesion"; las pruebas buscan "Salir"), con POST. */
export function BotonSalir({ variante }: { variante: 'lateral' | 'barra' }) {
  return (
    <form action="/admin/salir" method="post">
      {variante === 'lateral' ? (
        <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold border border-transparent text-muted-foreground hover:text-foreground hover:bg-white hover:border-border hover:shadow-md hover:shadow-slate-900/5 transition-all duration-300">
          <LogOut size={20} />
          Salir
        </button>
      ) : (
        <button
          aria-label="Salir"
          className="h-11 w-11 rounded-xl text-muted-foreground flex items-center justify-center transition-all duration-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
        >
          <LogOut size={18} className="transition-transform duration-300 hover:translate-x-0.5" />
        </button>
      )}
    </form>
  );
}
