let DEFAULT_WORD_BANK = null;

export const WORD_BANK_STORAGE_KEY = "customWordBank"; // custom word bank support
let CUSTOM_WORD_BANK = null;

function hasChromeStorage() {
  return typeof chrome !== "undefined" && chrome?.storage?.sync;
}

// for work bank
function normalizeWordBank(raw) {
  // accept array OR string; return cleaned array of words or null if too small
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

    // keep “word-ish” tokens; allow hyphen/apostrophe
    const safe = word.replace(/[^\p{L}\p{N}'-]/gu, "");
    if (!safe) continue;

    const key = safe.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    cleaned.push(safe);
  }

  return cleaned.length >= 5 ? cleaned : null;   // requires at least 5 words
}

function loadCustomWordBankCache() {
  if (!hasChromeStorage()) return;

  try {
    chrome.storage.sync.get([WORD_BANK_STORAGE_KEY], (res) => {
      CUSTOM_WORD_BANK = normalizeWordBank(res?.[WORD_BANK_STORAGE_KEY]);
    });

    // live update when options change
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") return;
      if (!changes[WORD_BANK_STORAGE_KEY]) return;

      CUSTOM_WORD_BANK = normalizeWordBank(changes[WORD_BANK_STORAGE_KEY].newValue);
    });
  } catch (err) {
    // if chrome.* not available in context, ignore
    CUSTOM_WORD_BANK = null;
  }
}

loadCustomWordBankCache(); // custom cache load immediately

// for default dictionary
function getDictionaryUrl() {
  if (typeof chrome !== "undefined" && chrome?.runtime?.getURL) {
    return chrome.runtime.getURL("src/dictionary.json");
  }
  return "./dictionary.json";   // dev fallback
}

fetch(getDictionaryUrl())
  .then((response) => response.json())
  .then((data) => {
    DEFAULT_WORD_BANK = data;
  })
  .catch((err) => {
    console.error("Failed to load dictionary:", err);
  });

export function getWordBank() {
  // prefer custom if available
  if (Array.isArray(CUSTOM_WORD_BANK) && CUSTOM_WORD_BANK.length > 0) {
    return CUSTOM_WORD_BANK;
  }

  // otherwise use default dictionary
  if (!DEFAULT_WORD_BANK) {
    throw new Error("Dictionary not loaded yet. Please try again.");
  }
  return DEFAULT_WORD_BANK;
}

export function getDefaultDictionary() {
  return DEFAULT_WORD_BANK;
}

// crypto-safe random int in [min, max)
export function secureRandomInt(min, max) {
  const range = max - min;
  if (range <= 0) throw new Error("Invalid range");

  // rejection sampling to avoid modulo bias
  const uint32Max = 0xffffffff;
  const limit = uint32Max - (uint32Max % range);

  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    const x = buf[0];
    if (x < limit) return min + (x % range);
  }
}

export function secureRandomChoice(arr) {
  if (!arr || arr.length === 0) throw new Error("Empty array");
  return arr[secureRandomInt(0, arr.length)];
}
