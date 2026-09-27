import rules from '@/shared/account_rules.json';

/** The same JSON the Laravel backend validates against, so the form and the server never disagree. */
export const AccountRules = rules;
export const AccountErrors = rules.errors;

const usernamePattern = new RegExp(rules.username.pattern);

export function validateUsername(username: string): string | null {
  const { minLength, maxLength } = rules.username;
  return username.length < minLength || username.length > maxLength || !usernamePattern.test(username)
    ? AccountErrors.invalidUsername
    : null;
}

export function validatePassword(password: string): string | null {
  const { minLength, maxLength } = rules.password;
  return password.length < minLength || password.length > maxLength ? AccountErrors.weakPassword : null;
}

/** displayName must already be trimmed. */
export function validateDisplayName(displayName: string): string | null {
  return displayName.length === 0 || displayName.length > rules.displayName.maxLength
    ? AccountErrors.invalidDisplayName
    : null;
}
