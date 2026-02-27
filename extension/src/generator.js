// Generator supports:
// - passphrase mode: word-bank + separator + optional transformations
// - random mode: strong random characters
//
// Custom word bank is stored in chrome.storage.sync under key: "customWordBank"

import { getWordBank, secureRandomInt, secureRandomChoice } from "./uiModel.js";

const DEFAULT_SYMBOLS = "!@#$%^&*()_+-=[]{};:,.?";
const SYMBOL_DICTIONARY = {
  O: "0",
  I: "1",
  A: "@",
  G: "6",
  S: "$",
  B: "8",
  E: "3",
  T: "+",
  Z: "2",
};

// ---- Custom word bank support (from Options page) ----
export const WORD_BANK_STORAGE_KEY = "customWordBank";
let CACHED_CUSTOM_WORD_BANK = null;

function hasChromeStorage() {
  return typeof chrome !== "undefined" && chrome?.storage?.sync;
}

function normalizeWordBank(raw) {
  let arr = [];

  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === "string") {
    arr = raw
      .split(/[\n,]+/g)
      .map((w) => w.trim())
      .filter(Boolean);
  }

  const cleaned = [];
  const seen = new Set();

  for (const w of arr) {
    const word = String(w).trim();
    if (!word) continue;

    const safe = word.replace(/[^\p{L}\p{N}'-]/gu, "");
    if (!safe) continue;

    const key = safe.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    cleaned.push(safe);
  }

  return cleaned.length >= 5 ? cleaned : null;
}

/**
 * Force-refresh the cached custom word bank from chrome.storage.sync.
 * Call this after Save/Reset so popup/preview uses the newest word bank immediately.
 */
export async function refreshCustomWordBank() {
  if (!hasChromeStorage()) return null;

  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get([WORD_BANK_STORAGE_KEY], (res) => {
        CACHED_CUSTOM_WORD_BANK = normalizeWordBank(res?.[WORD_BANK_STORAGE_KEY]);
        resolve(CACHED_CUSTOM_WORD_BANK);
      });
    } catch (e) {
      CACHED_CUSTOM_WORD_BANK = null;
      resolve(null);
    }
  });
}

function attachStorageListeners() {
  if (!hasChromeStorage()) return;

  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") return;
      if (!changes[WORD_BANK_STORAGE_KEY]) return;

      CACHED_CUSTOM_WORD_BANK = normalizeWordBank(changes[WORD_BANK_STORAGE_KEY].newValue);
    });
  } catch {
    // ignore
  }
}

refreshCustomWordBank();
attachStorageListeners();

function getActiveWordBank() {
  if (Array.isArray(CACHED_CUSTOM_WORD_BANK) && CACHED_CUSTOM_WORD_BANK.length > 0) {
    return CACHED_CUSTOM_WORD_BANK;
  }
  return getWordBank();
}

// ---- generator core ----

function titleCase(word) {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function maybeMutateWord(word, addCapitalization) {
  if (!addCapitalization) return word;
  return secureRandomInt(0, 2) === 0 ? titleCase(word) : word;
}

function injectDigits(pass, addDigits) {
  if (!addDigits) return pass;
  return pass + String(secureRandomInt(0, 10));
}

function injectSymbol(pass, addSymbols) {
  if (!addSymbols) return pass;
  const sym = DEFAULT_SYMBOLS[secureRandomInt(0, DEFAULT_SYMBOLS.length)];
  return pass + sym;
}

function replaceDigits(pass, numReplacements) {
  if (!numReplacements) return pass;

  const chars = pass.split("");
  const indices = [];

  chars.forEach((c, i) => {
    if (SYMBOL_DICTIONARY[c.toUpperCase()]) indices.push(i);
  });

  for (let i = indices.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < Math.min(numReplacements, indices.length); i++) {
    const idx = indices[i];
    chars[idx] = SYMBOL_DICTIONARY[chars[idx].toUpperCase()];
  }

  return chars.join("");
}

function buildPassphrase({ numWords, separator, addCapitalization }) {
  const bank = getActiveWordBank();
  const picks = [];
  for (let i = 0; i < numWords; i++) {
    const w = secureRandomChoice(bank);
    picks.push(maybeMutateWord(w, addCapitalization));
  }
  return picks.join(separator);
}

function buildRandom({ targetLength, addSymbols }) {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = DEFAULT_SYMBOLS;
  const alphabet = lower + upper + digits + (addSymbols ? symbols : "");

  let out = "";
  for (let i = 0; i < targetLength; i++) {
    out += alphabet[secureRandomInt(0, alphabet.length)];
  }
  return out;
}

export function generatePassword(cfg) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generator.js:generatePassword',message:'generatePassword entered',data:{mode:cfg?.mode},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const {
    mode,
    targetLength = 18, // ONLY used for random mode now
    numWords = 4,
    separator = "-",
    addCapitalization = true,
    addDigits = true,
    addSymbols = false,
    numReplacements = false,
  } = cfg;

  // Guardrails so 1–10 is allowed (your UI already restricts this)
  const safeNumWords = Number.isFinite(numWords) ? Math.max(1, Math.min(10, numWords)) : 4;

  if (mode === "random") {
    // ✅ Random passwords respect targetLength
    const safeLen = Number.isFinite(targetLength) ? Math.max(8, Math.min(128, targetLength)) : 18;
    return buildRandom({ targetLength: safeLen, addSymbols });
  }

  // ✅ Memorable passwords respect number of words (NOT character length)
  let pw = buildPassphrase({
    numWords: safeNumWords,
    separator,
    addCapitalization,
  });

  pw = injectDigits(pw, addDigits);
  pw = injectSymbol(pw, addSymbols);
  pw = replaceDigits(pw, numReplacements);

  return pw;
}
