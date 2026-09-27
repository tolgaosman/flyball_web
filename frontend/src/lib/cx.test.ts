import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('lets later padding override the default', () => {
    expect(cx('px-6 py-[18px]', 'px-3 py-1')).toBe('px-3 py-1');
  });

  it('keeps custom type-scale utilities alongside text colors', () => {
    expect(cx('text-headline', 'text-green')).toBe('text-headline text-green');
    expect(cx('text-headline', 'text-title')).toBe('text-title');
  });

  it('drops falsy entries', () => {
    expect(cx('a', false, null, undefined, 'b')).toBe('a b');
  });
});
