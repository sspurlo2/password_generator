import { generatePassword, refreshCustomWordBank } from "../src/generator.js";

const STORAGE_KEY = "customWordBank";
const MIXED_BANK_KEY = "mixed_bank";

const $ = (id) => document.getElementById(id);

function hasChromeStorage() {
  return typeof chrome !== "undefined" && chrome?.storage?.sync;
}

function normalizeWordBankInput(text) {
  const raw = String(text || "")
    .split(/[\n,]+/g)
    .map((w) => w.trim())
    .filter(Boolean);

  const out = [];
  const seen = new Set();

  for (const w of raw) {
    const safe = w.replace(/[^\p{L}\p{N}'-]/gu, "");
    if (!safe) continue;

    const key = safe.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push(safe);
  }

  return out;
}

function setStatus(msg) {
  const status = $("statusMsg");
  if (status) status.textContent = msg;
}

async function storageGet(key) {
  if (!hasChromeStorage()) return null;
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (res) => resolve(res?.[key] ?? null));
  });
}

async function storageSet(obj) {
  if (!hasChromeStorage()) return;
  return new Promise((resolve) => chrome.storage.sync.set(obj, resolve));
}

async function storageRemove(key) {
  if (!hasChromeStorage()) return;
  return new Promise((resolve) => chrome.storage.sync.remove([key], resolve));
}

document.addEventListener("DOMContentLoaded", async () => {
  // Apply and sync theme preference
  const theme_checkbox = document.querySelector('.switch .input');
  const isLight = localStorage.getItem('theme') === 'light';
  if (isLight) {
    document.documentElement.classList.add('light-theme');
  }
  if (theme_checkbox) {
    theme_checkbox.checked = !isLight;  // Inverted because CSS shows opposite icon
    theme_checkbox.addEventListener('change', () => {
      document.documentElement.classList.toggle('light-theme');
      localStorage.setItem('theme', document.documentElement.classList.contains('light-theme') ? 'light' : 'dark');
    });
  }

  const wordBankInput = $("wordBankInput");
  const saveBtn = $("saveBtn");
  const resetBtn = $("resetBtn");
  const previewBtn = $("previewBtn");
  const previewOut = $("previewOut");
  const mixed_bankCheck = $("mixed_bank");

  if (!wordBankInput || !saveBtn || !resetBtn || !previewBtn || !previewOut) {
    return;
  }

  if (!hasChromeStorage()) {
    setStatus("chrome.storage.sync is not available.");
    return;
  }

  // Load saved bank into textarea
  const saved = await storageGet(STORAGE_KEY);
  if (Array.isArray(saved) && saved.length) {
    wordBankInput.value = saved.join("\n");
    setStatus(`Loaded saved word bank (${saved.length} words).`);
  } else {
    setStatus("No custom word bank saved yet. Using default dictionary until you save one.");
  }

  // load mixed_bank preference and listen for changes
  const mixedBank = await storageGet(MIXED_BANK_KEY);
  if (mixed_bankCheck && mixedBank !== null) {
    mixed_bankCheck.checked = mixedBank;
  }

  if (mixed_bankCheck) {
    mixed_bankCheck.addEventListener("change", async () => {
      await storageSet({ [MIXED_BANK_KEY]: mixed_bankCheck.checked });
      setStatus(mixed_bankCheck.checked ? "Using both custom word bank and default dictionary." : "Using custom word bank only.");
    });
  }

  saveBtn.addEventListener("click", async () => {
    const words = normalizeWordBankInput(wordBankInput.value);
    if (words.length < 5) {
      setStatus("Please enter at least 5 valid words before saving.");
      return;
    }

    await storageSet({ [STORAGE_KEY]: words, [MIXED_BANK_KEY]: mixed_bankCheck.checked });

    // IMPORTANT: refresh generator cache immediately so preview/popup see it right away
    await refreshCustomWordBank();

    setStatus(`Saved ${words.length} words to your custom word bank.`);
  });

  resetBtn.addEventListener("click", async () => {
    await storageRemove(STORAGE_KEY);
    wordBankInput.value = "";

    // Refresh cache immediately
    await refreshCustomWordBank();

    setStatus("Reset complete. Generator will use the default dictionary word bank.");
  });

  previewBtn.addEventListener("click", async () => {
    try {
      // Ensure cache is current (especially right after Save/Reset)
      await refreshCustomWordBank();

      const pw = generatePassword({
        mode: "passphrase",
        targetLength: 18,
        numWords: 4,
        separator: "-",
        addCapitalization: true,
        addDigits: true,
        addSymbols: false,
        numReplacements: 2,
        mixed_bank: mixed_bankCheck?.checked ?? false,
      });

      previewOut.textContent = pw;
      setStatus("Preview generated (uses your custom word bank if saved).");
    } catch (e) {
      previewOut.textContent = "Error generating preview.";
      setStatus(String(e?.message || e));
    }
  });
});
