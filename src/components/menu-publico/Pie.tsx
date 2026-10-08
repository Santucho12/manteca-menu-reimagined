export function Pie({ anio }: { anio: number }) {
  return (
    <footer className="px-4 pt-5 pb-10 text-center">
      <div className="bg-border mx-auto mb-4 h-px w-8" />
      <p className="font-title mb-1 text-lg">Manteca</p>
      <p className="text-muted-foreground text-xs tracking-wide">© {anio} · Panadería Artesanal</p>
    </footer>
  );
}
