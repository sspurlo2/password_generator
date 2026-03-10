import { generatePassword, refreshCustomWordBank } from "../src/generator.js";
import { assessStrength } from "../src/strength.js";
import { leakedPasswordCheck, check_generated_password } from "../src/leakedCheck.js";

const $ = (id) => document.getElementById(id);

const mode = $("mode");
const length = $("length");
const words = $("words");
const separator = $("separator");
const cap = $("cap");
const digit = $("digit");
const symbol = $("symbol");
const embed = $("embed");
const generateBtn = $("generateBtn");
const generated = $("generated");
const copyBtn = $("copyBtn");

const lengthRow = $("lengthRow");
const wordsRow = $("wordsRow");
const generatedInfo = $("generatedInfo");

const toTest = $("toTest");
const testBtn = $("testBtn");
const results = $("results");

// // #region agent log
// fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:load',message:'Popup script loaded',data:{generateBtnExists:!!generateBtn,generatedExists:!!generated},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// // #endregion


const color_theme_checkbox = document.querySelector('.switch .input');
if (color_theme_checkbox) {   // load saved theme preference, default is dark
  const isLight = localStorage.getItem('theme') === 'light';
  if (isLight) {
    document.documentElement.classList.add('light-theme');
  }
  color_theme_checkbox.checked = !isLight; // switch is inverted
  
  color_theme_checkbox.addEventListener('change', () => {
    document.documentElement.classList.toggle('light-theme');
    localStorage.setItem('theme', document.documentElement.classList.contains('light-theme') ? 'light' : 'dark');
  });
}


function updateModeUI() {
  const isPassphrase = mode.value === "passphrase";

  // Requirement:
  // - Passphrase => hide target length
  // - Random => hide number of words
  if (lengthRow) lengthRow.style.display = isPassphrase ? "none" : "";
  if (wordsRow) wordsRow.style.display = isPassphrase ? "" : "none";

  // Make "Random (secure)" reliably score high by default:
  // - include symbols (4 char sets)
  // - use a length where the heuristic reaches the max length points
  if (!isPassphrase) {
    if (symbol && symbol.checked === false) symbol.checked = true;
    const n = Number(length?.value);
    if (Number.isFinite(n) && n > 0 && n < 20) length.value = "20";
  }
}


// Ensure the generator sees the latest custom word bank as soon as popup opens
refreshCustomWordBank().catch(() => {});

// Helper to read mixed_bank preference from storage
function storageGet(key) {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome?.storage?.sync) {
      chrome.storage.sync.get([key], (res) => resolve(res?.[key] ?? null));
    } else {
      resolve(null);
    }
  });
}

// Apply initial UI state + update on change
updateModeUI();
mode.addEventListener("change", updateModeUI);

generateBtn.addEventListener("click", async () => {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "popup.js:Generate",
      message: "Generate button clicked",
      data: { symbolChecked: symbol.checked },
      timestamp: Date.now(),
      runId: "run1",
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion

  const cfg = {
    mode: mode.value,
    targetLength: Number(length.value),
    numWords: Number(words.value),
    separator: separator.value,
    addCapitalization: cap.checked,
    addDigits: digit.checked,
    addSymbols: symbol.checked,
    numReplacements: embed.checked ? 2 : false,
    mixed_bank: await storageGet("mixed_bank") ?? false,
  };
  
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "popup.js:Config",
      message: "Config before generatePassword",
      data: { cfg },
      timestamp: Date.now(),
      runId: "run1",
      hypothesisId: "H2",
    }),
  }).catch(() => {});
  // #endregion
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "popup.js:BeforeGenerate",
      message: "About to call generatePassword",
      data: { mode: cfg.mode },
      timestamp: Date.now(),
      runId: "run1",
      hypothesisId: "H3",
    }),
  }).catch(() => {});
  // #endregion

  let generatedValue = "";
  try {
    generatedValue = generatePassword(cfg);
  } catch (e) {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/f0fc06d4-31b7-4e3a-a491-35983ecf4926", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "popup.js:GenerateError",
        message: "generatePassword threw",
        data: { error: String(e && e.message || e) },
        timestamp: Date.now(),
        runId: "run1",
        hypothesisId: "H4",
      }),
    }).catch(() => {});
    // #endregion
    generatedValue = "";
  }

  generated.value = generatedValue;

  // Show strength and leak check for the generated password
  if (generatedInfo && generated.value) {
    try {
      const { scoreHTML, leakedHTML } = await check_generated_password(generated.value);
      generatedInfo.innerHTML = scoreHTML + leakedHTML;
    } catch (e) {
      console.error("Generated password check failed:", e);
      generatedInfo.innerHTML = "";
    }
  }
});


copyBtn.addEventListener("click", async () => {
  if (!generated.value) return;
  await navigator.clipboard.writeText(generated.value);
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy"), 900);
});


testBtn.addEventListener("click", async () => {
  const pw = toTest.value ?? "";
  if (!pw) {
    results.textContent = "Enter a password to test.";
    return;
  }

  try {
    const model = await assessStrength(pw);
    renderResults(model);
  } catch (e) {
    console.error("Test failed:", e);
    results.innerHTML = `<div class="pw-leak leaked">Error: ${e.message}</div>`;
  }
});


async function renderResults(model) {
  const { scoreLabel, score, reasons, suggestions, leaked } = model;

  let leakedLine;
  if (leaked === null) {
    leakedLine = `<div class="pw-leak ok"><b>Leak Check:</b> Password has not been leaked.</div>`;
  } else {
    leakedLine = `<div class="pw-leak leaked"><b>Leak Check:</b> Password appears on leaked lists!</div>`;
  }
  // scoreLabel is now an object: { text, className }
  const labelText = scoreLabel?.text || scoreLabel;
  const labelClass = scoreLabel?.className || "";

  results.innerHTML = `
    <div><b>Strength:</b> ${score}/100, <span class="pw-label ${labelClass}">${labelText}</span></div>
    ${leakedLine}
    ${reasons?.length ? `<div style="margin-top:6px;"><b>Why:</b><ul>${reasons.map(r => `<li>${r}</li>`).join("")}</ul></div>` : ""}
    ${suggestions?.length ? `<div style="margin-top:6px;"><b>Improve:</b><ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul></div>` : ""}
  `;
}