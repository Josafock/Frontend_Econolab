// src/utils/passwordRules.ts
export type PasswordRule = {
  id: string;
  label: string;
  test: (v: string) => boolean;
};

export const passwordRules: PasswordRule[] = [
  { id: 'len',   label: 'Mínimo 8 caracteres',      test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Una mayúscula (A–Z)',      test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Una minúscula (a–z)',      test: (v) => /[a-z]/.test(v) },
  { id: 'num',   label: 'Un número (0–9)',          test: (v) => /\d/.test(v) },
  { id: 'sym',   label: 'Un símbolo (!@#$…)',       test: (v) => /[^A-Za-z0-9]/.test(v) }, // carácter especial
];

export function getPasswordStrength(password: string) {
  const satisfied = passwordRules.filter((r) => r.test(password)).length;
  if (!password) return { label: 'Débil', pct: 0, satisfied };

  const pct = Math.round((satisfied / passwordRules.length) * 100);
  const label = pct < 40 ? 'Débil' : pct < 80 ? 'Media' : 'Fuerte';
  return { label, pct, satisfied };
}

export function isPasswordStrong(password: string) {
  return passwordRules.every((r) => r.test(password));
}
