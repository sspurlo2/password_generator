import { generatePassword, check_generated_password } from "../src/generator.js";
import { assessStrength } from "../src/strength.js";
import { leakedPasswordCheck } from "../src/leakedCheck.js";

const $ = (id) => document.getElementById(id);

const mode = $("mode");
const length = $("length");
const words = $("words");
const separator = $("separator");
const cap = $("cap");
const digit = $("digit");
const symbol = $("symbol");
const embed = $("embed");
const leakCheck = $("leakCheck");
const generateBtn = $("generateBtn");
const generated = $("generated");
const copyBtn = $("copyBtn");
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


function renderResults(model) {
  const { scoreLabel, score, reasons, suggestions, leaked } = model;

  const leakedLine = leaked == null
    ? ""
    : leaked
      ? `<div><b>Leak check:</b> ⚠️ Found in leaked set</div>`
      : `<div><b>Leak check:</b> ✅ Not found</div>`;

  // scoreLabel is now an object: { text, className }
  const labelText = scoreLabel?.text || scoreLabel;
  const labelClass = scoreLabel?.className || "";

  results.innerHTML = `
    <div><b>Strength:</b> <span class="pw-label ${labelClass}">${labelText}</span> (${score}/100)</div>
    ${leakedLine}
    ${reasons?.length ? `<div style="margin-top:6px;"><b>Why:</b><ul>${reasons.map(r => `<li>${r}</li>`).join("")}</ul></div>` : ""}
    ${suggestions?.length ? `<div style="margin-top:6px;"><b>Improve:</b><ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul></div>` : ""}
  `;
}

generateBtn.addEventListener("click", async () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:44',message:'Generate button clicked',data:{},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const cfg = {
    mode: mode.value,
    targetLength: Number(length.value),
    numWords: Number(words.value),
    separator: separator.value,
    addCapitalization: cap.checked,
    addDigits: digit.checked,
    addSymbols: symbol.checked,
    numReplacements: embed.checked ? 2 : false
  };
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:55',message:'Calling generatePassword',data:{mode:cfg.mode},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const pw = generatePassword(cfg);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:60',message:'generatePassword returned',data:{pwLength:typeof pw=== 'string'? pw.length : -1},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    generated.value = pw;
    if (generatedInfo) {
      try {
        const { scoreHTML, leakedHTML } = await check_generated_password(pw);
        generatedInfo.innerHTML = scoreHTML + leakedHTML;
      } catch (e) {
        generatedInfo.innerHTML = "";
      }
    }
  } catch (e) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:65',message:'generatePassword threw',data:{err:String(e.message)},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    generated.value = "";
    if (generatedInfo) generatedInfo.innerHTML = "";
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

  // Local strength assessment
  const model = await assessStrength(pw);

  if (leakCheck?.checked) { // perform leak check
    try {
      model.leaked = await leakedPasswordCheck(pw);
    } catch (e) {
      model.leaked = null;
      model.suggestions.push("Leak check failed (offline/unconfigured).");
    }
  }

  renderResults(model);
});
