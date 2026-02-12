// options.js
// Uses chrome.storage.sync so settings follow the user across Chrome profiles (if signed in).
// You can swap to chrome.storage.local if you prefer.

const STORAGE_KEYS = {
  WORD_BANK: "wordBank"
};

const wordbankEl = document.getElementById("wordbank");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const generatePreviewBtn = document.getElementById("generatePreviewBtn");
const previewOut = document.getElementById("previewOut");

document.addEventListener("DOMContentLoaded", init);

function init() {
  loadOptions();

  saveBtn.addEventListener("click", saveOptions);
  clearBtn.addEventListener("click", clearWordBank);
  generatePreviewBtn.addEventListener("click", generatePreviewPassword);

  // Nice UX: Ctrl/Cmd+S to save
  document.addEventListener("keydown", (e) => {
    const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
    if (isSave) {
      e.preventDefault();
      saveOptions();
    }
  });
}

async function loadOptions() {
  try {
    const data = await storageGet([STORAGE_KEYS.WORD_BANK]);
    const wordBank = Array.isArray(data[STORAGE_KEYS.WORD_BANK])
      ? data[STORAGE_KEYS.WORD_BANK]
      : [];

    wordbankEl.value = wordBank.join("\n");
    setStatus("");
  } catch (err) {
    console.error("Failed to load options:", err);
    setStatus("Failed to load options.", true);
  }
}

async function saveOptions() {
  try {
    const raw = wordbankEl.value || "";
    const parsed = normalizeWordBank(raw);

    await storageSet({ [STORAGE_KEYS.WORD_BANK]: parsed });

    setStatus(`Saved ${parsed.length} word(s).`);
  } catch (err) {
    console.error("Failed to save options:", err);
    setStatus("Failed to save.", true);
  }
}

async function clearWordBank() {
  wordbankEl.value = "";
  previewOut.textContent = "";
  try {
    await storageSet({ [STORAGE_KEYS.WORD_BANK]: [] });
    setStatus("Cleared.");
  } catch (err) {
    console.error("Failed to clear:", err);
    setStatus("Failed to clear.", true);
  }
}

/**
 * Turns textarea content into an array of clean entries.
 * - Splits on newlines
 * - Trims whitespace
 * - Removes empty lines
 * - De-dupes (case-insensitive)
 */
function normalizeWordBank(text) {
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const entry of lines) {
    const key = entry.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(entry);
    }
  }
  return out;
}

/**
 * Example password generation using the stored word bank.
 * This is deliberately simple—replace with your real generator.
 */
async function generatePreviewPassword() {
  previewOut.textContent = "";

  const data = await storageGet([STORAGE_KEYS.WORD_BANK]);
  const bank = Array.isArray(data[STORAGE_KEYS.WORD_BANK]) ? data[STORAGE_KEYS.WORD_BANK] : [];

  if (bank.length < 2) {
    previewOut.textContent = "Add at least 2 words to preview.";
    return;
  }

  const word1 = sample(bank);
  let word2 = sample(bank);
  if (bank.length > 1) {
    // avoid duplicates sometimes
    let tries = 0;
    while (word2 === word1 && tries++ < 5) word2 = sample(bank);
  }

  const number = String(randInt(10, 99));
  const symbol = sample(["!", "@", "#", "$", "%", "&", "*"]);
  const cap1 = capitalize(word1);
  const cap2 = capitalize(word2);

  // Example format: WordWord99!
  previewOut.textContent = `${cap1}${cap2}${number}${symbol}`;
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? "#ff9aa2" : "";
  if (msg) {
    // Clear after a moment
    window.clearTimeout(setStatus._t);
    setStatus._t = window.setTimeout(() => {
      statusEl.textContent = "";
      statusEl.style.color = "";
    }, 1800);
  }
}

/** Promisified wrappers for chrome.storage */
function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function storageSet(obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(obj, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(err);
      else resolve();
    });
  });
}
