// Lightweight strength assessment skeleton.
// You can later swap in zxcvbn or your own model, but keep this interface stable.
import { COMMON_PASSWORDS } from './common_passwords.js';
import { leakedPasswordCheck } from './leakedCheck.js';
function hasLower(s) { return /[a-z]/.test(s); }
function hasUpper(s) { return /[A-Z]/.test(s); }
function hasDigit(s) { return /[0-9]/.test(s); }
function hasSymbol(s){ return /[^A-Za-z0-9]/.test(s); }

function countCharSets(pw) {
  return [hasLower(pw), hasUpper(pw), hasDigit(pw), hasSymbol(pw)].filter(Boolean).length;
}

// A simple heuristic score (0–100). Not perfect, but good enough to start testing.
export function heuristicScore(pw) {
  const len = pw.length;
  const sets = countCharSets(pw);

  // length contributes heavily
  let score = Math.min(60, len * 3);           // 20 chars -> 60
  score += sets * 10;                           // up to +40
  score = Math.min(100, score);

  // penalties for common bad patterns
  if (/^(.)\1+$/.test(pw)) score = Math.min(score, 10);        // all same char
  if (/password|qwerty|letmein|admin/i.test(pw)) score = Math.min(score, 20);
  if (/^[A-Za-z]+$/.test(pw)) score -= 10;                     // letters only
  if (/^[0-9]+$/.test(pw)) score = Math.min(score, 15);        // digits only

  return Math.max(0, Math.round(score));
}

export function label(score) {
  if (score >= 85) return "Very strong ★★★★★";
  if (score >= 70) return "Strong ★★★★☆";
  if (score >= 50) return "Okay ★★★☆☆";
  if (score >= 30) return "Weak ★★☆☆☆";
  return "Very weak ★☆☆☆☆";
}

export async function assessStrength(pw) {
  const reasons = [];
  const suggestions = [];

  const len = pw.length;
  const sets = countCharSets(pw);
  const score = heuristicScore(pw);

  // Check against known very common passwords
  const normalized = pw.trim().toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    reasons.push("Password appears in lists of extremely common passwords.");
    suggestions.push("Choose a password not on common-password lists; use a long passphrase or a password manager.");
    return {
      score: 0,
      scoreLabel: "Unacceptable",
      reasons,
      suggestions,
      leaked: null,
      unacceptable: true
    };
  }

  const isLeaked = await leakedPasswordCheck(pw); // check against the leaked dataset
  if (isLeaked != null) {
    reasons.push(`This password has been compromised ${isLeaked} times.`);
    suggestions.push("Do not use this password anywhere. Choose a completely different password.");
    return {
      score: 0,
      scoreLabel: "Unacceptable",
      reasons,
      suggestions,
      leaked: true,
      unacceptable: true
    };
  }

  if (len < 12) {
    reasons.push("Short passwords are easier to guess or crack.");
    suggestions.push("Aim for 15+ characters (long passphrases work well).");
  } else if (len < 15) {
    reasons.push("Length is decent, but 15+ is better for modern attacks.");
    suggestions.push("Increase length to 15–20+ characters if possible.");
  } else {
    reasons.push("Good length.");
  }

  if (sets <= 1) {
    reasons.push("Low character variety (only one type).");
    suggestions.push("Mix letters + numbers, or use a longer passphrase.");
  } else if (sets === 2) {
    reasons.push("Moderate character variety.");
    suggestions.push("Add another character type or increase length.");
  } else {
    reasons.push("Good character variety.");
  }

  if (/password|qwerty|letmein|admin/i.test(pw)) {
    reasons.push("Contains extremely common password terms.");
    suggestions.push("Avoid common words like 'password', 'admin', or keyboard patterns.");
  }

  if (/\s/.test(pw)) {
    reasons.push("Contains spaces (some sites reject spaces).");
    suggestions.push("If a site rejects spaces, replace with '-' or another separator.");
  }

  // Add positive indicator if password not found in leaked dataset
  reasons.push("Password not found in leaked dataset.");

  return {
    score,
    scoreLabel: label(score),
    reasons,
    suggestions,
    leaked: false
  };
}
