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

// #region agent log
fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:load',message:'Popup script loaded',data:{generateBtnExists:!!generateBtn,generatedExists:!!generated},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion


const color_theme_checkbox = document.querySelector('.switch .input');
if (color_theme_checkbox) {
  color_theme_checkbox.addEventListener('change', () => {
    document.documentElement.classList.toggle('light-theme');
    // Optionally, save the user preference to local storage
  });
}


function updateModeUI() {
  const isPassphrase = mode.value === "passphrase";

  // Requirement:
  // - Passphrase => hide target length
  // - Random => hide number of words
  if (lengthRow) lengthRow.style.display = isPassphrase ? "none" : "";
  if (wordsRow) wordsRow.style.display = isPassphrase ? "" : "none";
}


// Ensure the generator sees the latest custom word bank as soon as popup opens
refreshCustomWordBank().catch(() => {});

// Apply initial UI state + update on change
updateModeUI();
mode.addEventListener("change", updateModeUI);

generateBtn.addEventListener("click", async () => {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "popup.js:Generate",
      message: "Generate button clicked",
      data: { symbolChecked: symbol.checked },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "C",
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
  };
  
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "popup.js:Config",
      message: "Config before generatePassword",
      data: { cfg },
      timestamp: Date.now(),
      sessionId: "debug-session",
      runId: "run1",
      hypothesisId: "C",
    }),
  }).catch(() => {});
  // #endregion

  generated.value = generatePassword(cfg);

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
  // if (leaked === false) {
  //   leakedLine = `<div class="pw-leak ok"><b>Leak Check:</b> Password has not been leaked.</div>`;
  // } else if (leaked !== null && leaked !== true) {
  //   leakedLine = `<div class="pw-leak leaked"><b>Leak Check:</b> Password has been leaked ${leaked} times. Please re-generate.</div>`;
  // } else {
  //   leakedLine = `<div class="pw-leak"><b>Leak Check:</b> Unavailable or skipped.</div>`;
  // }
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