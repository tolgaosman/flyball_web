const FOLD: Record<string, string> = {
  İ: 'i', I: 'i', ı: 'i',
  Ş: 's', ş: 's',
  Ğ: 'g', ğ: 'g',
  Ü: 'u', ü: 'u',
  Ö: 'o', ö: 'o',
  Ç: 'c', ç: 'c',
  É: 'e', é: 'e', È: 'e', è: 'e', Ê: 'e', ê: 'e', Ë: 'e', ë: 'e',
  Á: 'a', á: 'a', À: 'a', à: 'a', Â: 'a', â: 'a', Ä: 'a', ä: 'a',
  Ñ: 'n', ñ: 'n',
  Ø: 'o', ø: 'o',
  Å: 'a', å: 'a',
  Í: 'i', í: 'i', Î: 'i', î: 'i',
  Ú: 'u', ú: 'u', Û: 'u', û: 'u',
  Ý: 'y', ý: 'y',
};

/**
 * Accent- and case-insensitive form for search, so "ozil" finds "Özil" and
 * "ilkay" finds "İlkay" (plain toLowerCase() turns "İ" into "i̇", which breaks matching).
 */
export function fold(input: string): string {
  let out = '';
  for (const ch of input) out += FOLD[ch] ?? ch.toLowerCase();
  return out;
}

export function foldContains(haystack: string, needle: string): boolean {
  return fold(haystack).includes(fold(needle));
}

/** Locale-correct uppercasing: in Turkish "i" → "İ", not "I". */
export function upperFor(text: string, locale: string): string {
  return text.toLocaleUpperCase(locale === 'tr' ? 'tr' : 'en');
}
