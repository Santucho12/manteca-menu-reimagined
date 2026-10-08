import { Aparecer } from './Aparecer';

const VIRTUDES = [
  { icono: '⏳', valor: '3 días', texto: 'de elaboración' },
  { icono: '🧈', valor: '100%', texto: 'manteca real' },
  { icono: '🌿', valor: 'Orgánico', texto: 'harinas selectas' },
  { icono: '🤲', valor: 'Artesanal', texto: 'hecho a mano' },
];

export function BloqueFinal() {
  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-6">
      <Aparecer className="relative mx-auto max-w-lg text-center">
        <span aria-hidden="true" className="mb-3 block text-3xl">
          🌾
        </span>
        <h2 className="mb-3 text-2xl leading-snug">
          Hecho con amor, tiempo
          <br />y las mejores materias primas
        </h2>
        <div className="divisor-de-seccion mb-5" />
        <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed">
          Nuestros productos son totalmente artesanales, hechos uno por uno, con procesos de hasta{' '}
          <strong className="text-foreground">3 días de elaboración</strong>. Usamos{' '}
          <strong className="text-foreground">harinas orgánicas</strong>,{' '}
          <strong className="text-foreground">masa madre</strong> y{' '}
          <strong className="text-foreground">100% manteca</strong>.
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {VIRTUDES.map((v) => (
            <li key={v.valor} className="bg-secondary/80 rounded-2xl p-3 text-center">
              <span aria-hidden="true" className="mb-1.5 block text-2xl">
                {v.icono}
              </span>
              <span className="block text-sm font-bold">{v.valor}</span>
              <span className="text-muted-foreground text-[0.6rem] tracking-wide uppercase">
                {v.texto}
              </span>
            </li>
          ))}
        </ul>
      </Aparecer>
    </section>
  );
}
