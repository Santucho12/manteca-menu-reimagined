import { describe, expect, it } from 'vitest';
import { tamanoLegible } from './tamanoLegible';

describe('tamanoLegible', () => {
  it('muestra bytes, KB y MB con coma decimal', () => {
    expect(tamanoLegible(512)).toBe('512 B');
    expect(tamanoLegible(2048)).toBe('2 KB');
    expect(tamanoLegible(1536)).toBe('1,5 KB');
    expect(tamanoLegible(5 * 1024 * 1024)).toBe('5 MB');
  });
});
