// Generator supports:
// - passphrase mode: word-bank + separator + optional transformations
// - random mode: strong random characters

// FIXME, need to expand this to generate from a dictionary wordbank

import { getWordBank } from "./uiModel.js";
import { secureRandomInt, secureRandomChoice } from "./uiModel.js";
import { heuristicScore, label} from './strength.js';
import { leakedPasswordCheck } from './leakedCheck.js';


const DEFAULT_SYMBOLS = "!@#$%^&*()_+-=[]{};:,.?";
const SYMBOL_DICTIONARY = { "O":"0", "I":"1", "A":"@", "G":"6", "S":"$", "B":"8", "E":"3", "T": "+", "Z":"2" };

function titleCase(word) {
  if (!word) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function maybeMutateWord(word, addCapitalization) {
  if (!addCapitalization) return word;
  // 50/50 title-case; easy to tune later
  return (secureRandomInt(0, 2) === 0) ? titleCase(word) : word;
}

function injectDigits(pass, addDigits) {
  if (!addDigits) return pass;
  const d = String(secureRandomInt(0, 10));
  // append a single digit by default (tune later)
  return pass + d;
}

function injectSymbol(pass, addSymbols) {
  if (!addSymbols) return pass;
  const sym = DEFAULT_SYMBOLS[secureRandomInt(0, DEFAULT_SYMBOLS.length)];
  return pass + sym;
}

function replaceDigits(pass, numReplacements) { // function that replaces letters/numbers with numbers/symbols
  if (!numReplacements) return pass;
  
  const chars = pass.split("");
  const indices = [];

  chars.forEach((c, i) => {
    if (SYMBOL_DICTIONARY[c.toUpperCase()]) { indices.push(i); }}); // push uppercase characters to the array
    

  for (let i = indices.length - 1; i > 0; i--) { // randomize which letter to replace
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < Math.min(numReplacements, indices.length); i++) {
    const idx = indices[i];
    chars[idx] = SYMBOL_DICTIONARY[chars[idx].toUpperCase()];
  }

  return chars.join("");
}

function buildPassphrase({ numWords, separator, addCapitalization }) {
  const bank = getWordBank();
  const picks = [];
  for (let i = 0; i < numWords; i++) {
    const w = secureRandomChoice(bank);
    picks.push(maybeMutateWord(w, addCapitalization));
  }
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

export async function check_generated_password(pw) {
  const score = heuristicScore(pw);
  // let leaked = null;
  // try {
  //   leaked = await leakedPasswordCheck(pw);
  // } catch (e) {
  //   leaked = null;
  // }
  const leaked = await leakedPasswordCheck(pw);

  const scoreHTML = `<div class="pw-score"><strong>Score:</strong> ${score} — <span class="pw-label">${label(score)}</span></div>`;

  let leakedHTML;
  if (leaked === null) {
    leakedHTML = `<div class="pw-leak ok">Password has not been leaked.</div>`;
  } else {
    leakedHTML = `<div class="pw-leak leaked">Password has been leaked ${leaked} times. Please re-generate.</div>`;
  }

  return { scoreHTML, leakedHTML };
}

export function generatePassword(cfg) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generator.js:generatePassword',message:'generatePassword entered',data:{mode:cfg?.mode},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const {
    mode,
    targetLength = 18,
    numWords = 4,
    separator = "-",
    addCapitalization = true,
    addDigits = true,
    addSymbols = false,
    numReplacements = false
  } = cfg;

  let pw;
  if (mode === "random") {
    pw = buildRandom({ targetLength, addSymbols });
  } else {
    pw = buildPassphrase({ numWords, separator, addCapitalization });
    pw = injectDigits(pw, addDigits);
    pw = injectSymbol(pw, addSymbols);
    pw = replaceDigits(pw, numReplacements)

    // If user wants minimum length, pad with extra word(s) rather than random chars
    while (pw.length < targetLength) {
      pw += separator + secureRandomChoice(getWordBank());
      if (addDigits) pw = injectDigits(pw, true);
    }
  }

  return pw;
}
