// Central place for word bank + crypto-safe randomness.
// import { english as diceware } from "eff-diceware-passphrase";

// const DEFAULT_WORD_BANK = Array.isArray(diceware) // normalize the array
//   ? diceware
//   : Object.values(diceware);

let DEFAULT_WORD_BANK = null;

// Pre-load the dictionary when the module loads
fetch("../src/dictionary.json")
  .then(response => response.json())
  .then(data => {
    DEFAULT_WORD_BANK = data;
  })
  .catch(err => {
    console.error("Failed to load dictionary:", err);
  });

export function getWordBank() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5859476a-1f0a-47c6-b1ed-24232e746d57',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'uiModel.js:getWordBank',message:'getWordBank called',data:{loaded:!!DEFAULT_WORD_BANK},timestamp:Date.now(),runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  if (!DEFAULT_WORD_BANK) {
    throw new Error("Dictionary not loaded yet. Please try again.");
  }
  return DEFAULT_WORD_BANK;
}

// Change to allow user to pick a word bank in options and store it in chrome.storage.

  // Crypto-safe random int in [min, max)
  export function secureRandomInt(min, max) {
    const range = max - min;
    if (range <= 0) throw new Error("Invalid range");
  
    // Rejection sampling to avoid modulo bias
    const uint32Max = 0xFFFFFFFF;
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
  