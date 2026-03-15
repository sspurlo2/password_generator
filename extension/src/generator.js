// This generator supports: passphrase mode (word-bank + separator + optional transformations)
// and random mode (strong random characters). 
// custom word bank is stored in chrome.storage.sync under key: "customWordBank"

import { getWordBank, getDefaultDictionary, secureRandomInt, secureRandomChoice } from "./uiModel.js";

const DEFAULT_SYMBOLS = "!@#$%^&*()_+-=[]{};:?";
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

// custom word bank support (for options.js)
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

// Force-refresh the cached custom word bank from chrome.storage.sync.
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

function getActiveWordBank(mixed_bank = false) {
  const custom = Array.isArray(CACHED_CUSTOM_WORD_BANK) && CACHED_CUSTOM_WORD_BANK.length > 0 
    ? CACHED_CUSTOM_WORD_BANK 
    : null;
  
  if (!custom) {
    return getWordBank(); // use dictionary only
  }
  
  if (!mixed_bank) {
    return custom;  // use custom only
  }
  
  try {
    return dedupeBankCaseInsensitive([...custom, ...getDefaultDictionary()]); // combine custom and default
  } catch {
    return custom;
  }
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


// Deduplicate a word bank case-insensitively while preserving first-seen order.
function dedupeBankCaseInsensitive(bank) {
  const out = [];
  const seen = new Set();

  for (const w of bank || []) {
    const word = String(w ?? "").trim();
    if (!word) continue;

    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push(word);
  }

  return out;
}

// Crypto-safe Fisher–Yates shuffle using secureRandomInt.

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPassphrase({ numWords, separator, addCapitalization, mixed_bank = false }) {
  // Enforce "no duplicates anywhere" by sampling without replacement
  let chosen = [];

  if (mixed_bank) { // setting for 50% word bank, 50% preset dictionary
    const custom = Array.isArray(CACHED_CUSTOM_WORD_BANK) && CACHED_CUSTOM_WORD_BANK.length > 0 
      ? CACHED_CUSTOM_WORD_BANK 
      : null;
    
    // if no custom word bank, just use dictionary
    if (!custom) {
      const bankRaw = getActiveWordBank(false);
      const bank = dedupeBankCaseInsensitive(bankRaw);
      const shuffled = shuffleInPlace([...bank]);
      chosen = shuffled.slice(0, numWords);
    
    } else {
      let dict = null;
      dict = getDefaultDictionary();

      const customCount = Math.ceil(numWords / 2); // 50% calculation
      const dictCount = numWords - customCount;
      
      const customDedup = dedupeBankCaseInsensitive(custom);
      const dictDedup = dedupeBankCaseInsensitive(dict);
      
      const customPicks = shuffleInPlace([...customDedup]).slice(0, customCount);
      const dictPicks = shuffleInPlace([...dictDedup]).slice(0, dictCount);
      chosen = shuffleInPlace([...customPicks, ...dictPicks]);
    }
  
  } else {
    const bankRaw = getActiveWordBank(false);
    const bank = dedupeBankCaseInsensitive(bankRaw);
    const shuffled = shuffleInPlace([...bank]);
    chosen = shuffled.slice(0, numWords);
  }

  const picks = chosen.map((w) => maybeMutateWord(w, addCapitalization));
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
  fetch("http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "generator.js:generatePassword",
      message: "generatePassword entered",
      data: { mode: cfg?.mode, cfg },
      timestamp: Date.now(),
      runId: "run1",
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion

  const { // these are the defaults
    mode,
    targetLength = 20, // ONLY used for random mode
    numWords = 4, // ONLY used for passphrase mode
    separator = "-",
    addCapitalization = true,
    addDigits = true,
    addSymbols = false,
    numReplacements = false,
    mixed_bank = false,
  } = cfg;

  let default_wrdcnt = 4;
  if (Number.isFinite(numWords)) { // these errors print from popup.js
    if (numWords < 2) {
      throw new Error("ERROR: Passphrase cannot have less than 2 words");
    }
    if (numWords > 10) {
      throw new Error("ERROR: Passphrase cannot have more than 10 words");
    }
    default_wrdcnt = Math.max(2, Math.min(10, numWords)); // 2 - 10 guardrails
  }

  if (mode === "random") {
    let default_len = 20;
    if (Number.isFinite(targetLength)) { // these errors print from popup.js
      if (targetLength < 8) {
      throw new Error("ERROR: Password cannot have less than 8 characters");
      }
      if (targetLength > 128) {
        throw new Error("ERROR: Password cannot have more than 128 characters");
      }
      default_len = Math.max(8, Math.min(128, targetLength)); // 8 - 128 guardrails
    }
    
    const out = buildRandom({ targetLength: default_len, addSymbols });

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "generator.js:generatePassword",
        message: "random password generated",
        data: { len: out.length, preview: out.slice(0, 4) },
        timestamp: Date.now(),
        runId: "run1",
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion

    return out;
  }

  // memorable passwords respect number of words
  let pw = buildPassphrase({
    numWords: default_wrdcnt,
    separator,
    addCapitalization,
    mixed_bank,
  });

  pw = injectDigits(pw, addDigits);
  pw = injectSymbol(pw, addSymbols);
  pw = replaceDigits(pw, numReplacements);

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "generator.js:generatePassword",
      message: "passphrase password generated",
      data: { len: pw.length, numWords: default_wrdcnt },
      timestamp: Date.now(),
      runId: "run1",
      hypothesisId: "H3",
    }),
  }).catch(() => {});
  // #endregion

  return pw;
}
