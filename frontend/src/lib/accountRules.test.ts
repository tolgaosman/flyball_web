import { describe, expect, it } from 'vitest';
import { validateDisplayName, validatePassword, validateUsername } from './accountRules';

describe('account rules (shared with Laravel)', () => {
  it('accepts 3–20 letters, digits, _ and .', () => {
    expect(validateUsername('tolga.osman_1')).toBeNull();
    expect(validateUsername('ab')).toBe('invalid_username');
    expect(validateUsername('a'.repeat(21))).toBe('invalid_username');
    expect(validateUsername('a b')).toBe('invalid_username');
    expect(validateUsername('abc\n')).toBe('invalid_username');
    expect(validateUsername('özil')).toBe('invalid_username');
  });

  it('requires 8–128 character passwords', () => {
    expect(validatePassword('short')).toBe('weak_password');
    expect(validatePassword('long enough')).toBeNull();
    expect(validatePassword('x'.repeat(129))).toBe('weak_password');
  });

  it('limits display names to 24 characters', () => {
    expect(validateDisplayName('')).toBe('invalid_display_name');
    expect(validateDisplayName('Tolga')).toBeNull();
    expect(validateDisplayName('x'.repeat(25))).toBe('invalid_display_name');
  });
});
