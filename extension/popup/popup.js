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
  const cfg = {
    mode: mode.value,
    targetLength: Number(length.value),
    numWords: Number(words.value),
    separator: separator.value,
    addCapitalization: cap.checked,
    addDigits: digit.checked,
    addSymbols: symbol.checked
  };
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
  const model = assessStrength(pw);

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
