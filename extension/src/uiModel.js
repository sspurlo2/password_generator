// Central place for word bank + crypto-safe randomness.

const DEFAULT_WORD_BANK = [
    "duck", "forest", "river", "planet", "mango", "signal", "orbit", "hazel",
    "canvas", "alpine", "lucky", "violet", "pioneer", "ember", "cobalt", "puzzle"
  ];
  
  // Change to allow user to pick a word bank in options and store it in chrome.storage.
  export function getWordBank() {
    return DEFAULT_WORD_BANK;
  }
chrome.storage.sync.get(["wordBank"], ({ wordBank }) => {
  const bank = Array.isArray(wordBank) ? wordBank : [];
    // use `bank` in your generator
});
  
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
  