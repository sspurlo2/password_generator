import { generatePassword } from "../src/generator.js";
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
const generateBtn = $("generateBtn");
const generated = $("generated");
const copyBtn = $("copyBtn");

const toTest = $("toTest");
const testBtn = $("testBtn");
const results = $("results");
const leakCheck = $("leakCheck");

function renderResults(model) {
  const { scoreLabel, score, reasons, suggestions, leaked } = model;

  const leakedLine = leaked == null
    ? ""
    : leaked
      ? `<div><b>Leak check:</b> ⚠️ Found in leaked set</div>`
      : `<div><b>Leak check:</b> ✅ Not found</div>`;

  results.innerHTML = `
    <div><b>Strength:</b> ${scoreLabel} (${score}/100)</div>
    ${leakedLine}
    ${reasons?.length ? `<div style="margin-top:6px;"><b>Why:</b><ul>${reasons.map(r => `<li>${r}</li>`).join("")}</ul></div>` : ""}
    ${suggestions?.length ? `<div style="margin-top:6px;"><b>Improve:</b><ul>${suggestions.map(s => `<li>${s}</li>`).join("")}</ul></div>` : ""}
  `;
}

generateBtn.addEventListener("click", () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:40',message:'Generate button clicked',data:{symbolChecked:symbol.checked},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'popup.js:49',message:'Config before generatePassword',data:{cfg},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  generated.value = generatePassword(cfg);
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

  // Optional leak check (stubbed, wire later)
  if (leakCheck.checked) {
    try {
      model.leaked = await leakedPasswordCheck(pw);
    } catch (e) {
      model.leaked = null;
      model.suggestions.push("Leak check failed (offline/unconfigured).");
    }
  }

  renderResults(model);
});
