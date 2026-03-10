// Central place for word bank + crypto-safe randomness.

let DEFAULT_WORD_BANK = null;

// ---- Custom word bank support ----
export const WORD_BANK_STORAGE_KEY = "customWordBank";

let CUSTOM_WORD_BANK = null;

function hasChromeStorage() {
  return typeof chrome !== "undefined" && chrome?.storage?.sync;
}

function normalizeWordBank(raw) {
  // Accept array OR string; return cleaned array of words or null if too small
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

    // Keep “word-ish” tokens; allow hyphen/apostrophe
    const safe = word.replace(/[^\p{L}\p{N}'-]/gu, "");
    if (!safe) continue;

    const key = safe.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    cleaned.push(safe);
  }

  // Require at least a few words to be useful
  return cleaned.length >= 5 ? cleaned : null;
}

function loadCustomWordBankCache() {
  if (!hasChromeStorage()) return;

  try {
    chrome.storage.sync.get([WORD_BANK_STORAGE_KEY], (res) => {
      CUSTOM_WORD_BANK = normalizeWordBank(res?.[WORD_BANK_STORAGE_KEY]);
    });

    // Live update when options change
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync") return;
      if (!changes[WORD_BANK_STORAGE_KEY]) return;

      CUSTOM_WORD_BANK = normalizeWordBank(changes[WORD_BANK_STORAGE_KEY].newValue);
    });
  } catch (err) {
    // If chrome.* not available in context, ignore
    CUSTOM_WORD_BANK = null;
  }
}

// Kick off custom cache load immediately
loadCustomWordBankCache();

// ---- Default dictionary load ----
function getDictionaryUrl() {
  // In an extension context, use an absolute URL to avoid path confusion.
  if (typeof chrome !== "undefined" && chrome?.runtime?.getURL) {
    return chrome.runtime.getURL("src/dictionary.json");
  }
  // Fallback for running as plain files during dev.
  return "./dictionary.json";
}

fetch(getDictionaryUrl())
  .then((response) => response.json())
  .then((data) => {
    DEFAULT_WORD_BANK = data;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'uiModel.js:dictionary',message:'Dictionary loaded',data:{size:Array.isArray(data)?data.length:null},timestamp:Date.now(),runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
  })
  .catch((err) => {
    console.error("Failed to load dictionary:", err);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'uiModel.js:dictionary',message:'Failed to load dictionary',data:{error:String(err && err.message || err)},timestamp:Date.now(),runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
  });

export function getWordBank() {
  // Prefer custom if available
  if (Array.isArray(CUSTOM_WORD_BANK) && CUSTOM_WORD_BANK.length > 0) {
    return CUSTOM_WORD_BANK;
  }

  // Otherwise use default dictionary
  if (!DEFAULT_WORD_BANK) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'uiModel.js:getWordBank',message:'Dictionary not loaded when requested',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion
    throw new Error("Dictionary not loaded yet. Please try again.");
  }
  return DEFAULT_WORD_BANK;
}

export function getDefaultDictionary() {
  return DEFAULT_WORD_BANK;
}

// ---- Crypto-safe random helpers ----

// Crypto-safe random int in [min, max)
export function secureRandomInt(min, max) {
  const range = max - min;
  if (range <= 0) throw new Error("Invalid range");

  // Rejection sampling to avoid modulo bias
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
