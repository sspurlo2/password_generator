// Generator supports:
// - passphrase mode: word-bank + separator + optional transformations
// - random mode: strong random characters

import { getWordBank } from "./uiModel.js";
import { secureRandomInt, secureRandomChoice } from "./uiModel.js";

const DEFAULT_SYMBOLS = "!@#$%^&*()_+-=[]{};:,.?";

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

export function generatePassword(cfg) {
  const {
    mode,
    targetLength = 18,
    numWords = 4,
    separator = "-",
    addCapitalization = true,
    addDigits = true,
    addSymbols = false
  } = cfg;

  let pw;
  if (mode === "random") {
    pw = buildRandom({ targetLength, addSymbols });
  } else {
    pw = buildPassphrase({ numWords, separator, addCapitalization });
    pw = injectDigits(pw, addDigits);
    pw = injectSymbol(pw, addSymbols);

    // If user wants minimum length, pad with extra word(s) rather than random chars
    while (pw.length < targetLength) {
      pw += separator + secureRandomChoice(getWordBank());
      if (addDigits) pw = injectDigits(pw, true);
    }
  }

  return pw;
}
