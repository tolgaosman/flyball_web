import { describe, expect, it } from 'vitest';
import { fold, foldContains, upperFor } from './text';

describe('fold', () => {
  it('folds Turkish and accented letters to plain lowercase ASCII', () => {
    expect(fold('İlkay Gündoğan')).toBe('ilkay gundogan');
    expect(fold('Mesut Özil')).toBe('mesut ozil');
    expect(fold('Hakan Çalhanoğlu')).toBe('hakan calhanoglu');
    expect(fold('Ødegaard')).toBe('odegaard');
    expect(fold('IŞIK')).toBe('isik');
  });

  it('matches search queries regardless of accents and case', () => {
    expect(foldContains('İlkay Gündoğan', 'ilkay')).toBe(true);
    expect(foldContains('Mesut Özil', 'OZIL')).toBe(true);
    expect(foldContains('Kylian Mbappé', 'mbappe')).toBe(true);
    expect(foldContains('Kylian Mbappé', 'messi')).toBe(false);
  });
});

describe('upperFor', () => {
  it('uses Turkish casing rules for tr', () => {
    expect(upperFor('giriş', 'tr')).toBe('GİRİŞ');
    expect(upperFor('ılık', 'tr')).toBe('ILIK');
  });

  it('uses standard casing otherwise', () => {
    expect(upperFor('tolga', 'en')).toBe('TOLGA');
  });
});
