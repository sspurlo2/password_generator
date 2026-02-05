// Small default set of very common passwords.
// Replace or expand this file with the full NordPass list (or another data source)
// if you want a more comprehensive check.
export const COMMON_PASSWORDS = new Set([
  // Extremely common numeric sequences
  '123456', '123456789', '12345', '12345678', '111111', '1234567',
  // Common words and keyboard patterns
  'password', 'qwerty', 'abc123', 'letmein', 'monkey', 'dragon', 'iloveyou',
  // Frequent short variations
  'admin', 'welcome', 'password1', 'master', 'hello', 'freedom', 'whatever',
  // Common appended numbers
  'qwerty123', '1q2w3e4r', 'baseball', 'football'
]);

// Note: This file intentionally includes a small representative sample so the
// extension remains lightweight. To use the NordPass list, replace the array
// contents with entries from https://nordpass.com/most-common-passwords-list/.
