import { describe, expect, it } from 'vitest';
import { listasAlDia } from './alAbrir';

describe('listasAlDia', () => {
  it('si no se generó nada, usa lo que ya leyó y no vuelve a leer', async () => {
    let releyo = false;
    const listas = await listasAlDia(0, ['leída'], async () => {
      releyo = true;
      return ['releída'];
    });
    expect(listas).toEqual(['leída']);
    expect(releyo).toBe(false);
  });

  it('si se generó algo, vuelve a leer', async () => {
    expect(await listasAlDia(2, ['leída'], async () => ['releída'])).toEqual(['releída']);
  });
});
