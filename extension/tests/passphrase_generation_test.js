const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { pathToFileURL } = require("url");

// Minimal polyfills so the extension modules can load in Node (no extension code changes).
globalThis.crypto ??= crypto.webcrypto;
globalThis.chrome ??= { runtime: { getURL: (p) => p } };
globalThis.fetch = async (url) => {
    const s = String(url);
    if (s.endsWith("dictionary.json")) {
    const dictPath = path.join(__dirname, "..", "src", "dictionary.json");
    return { json: async () => JSON.parse(await fs.readFile(dictPath, "utf8")) };
    }
    throw new Error(`Unsupported fetch in tests: ${s}`);
};

(async () => {
    const { generatePassword } = await import(pathToFileURL(path.join(__dirname, "..", "src", "generator.js")).href);
    const { assessStrength } = await import(
    pathToFileURL(path.join(__dirname, "..", "src", "strength.js")).href
    );

    const cfg1 = { // these are the default settings of the app
        mode: "passphrase",
        numWords: 4,
        separator: "-",
        addCapitalization: true,
        addDigits: true,
        addSymbols: false,
        numReplacements: false
    };

    const cfg2 = { // test 2
        mode: "passphrase",
        numWords: 4,
        separator: "",
        addCapitalization: false,
        addDigits: false,
        addSymbols: false,
        numReplacements: false
    };

    const cfg3 = { // test 3
        mode: "passphrase",
        numWords: 4,
        separator: "",
        addCapitalization: true,
        addDigits: false,
        addSymbols: false,
        numReplacements: false
    };

    const cfg4 = { // test 4
        mode: "passphrase",
        numWords: 4,
        separator: "",
        addCapitalization: true,
        addDigits: true,
        addSymbols: false,
        numReplacements: false
    };

    const cfg5 = { // test 5
        mode: "passphrase",
        numWords: 4,
        separator: "",
        addCapitalization: true,
        addDigits: true,
        addSymbols: true,
        numReplacements: false
    };

    const cfg6 = { // test 6
        mode: "passphrase",
        numWords: 4,
        separator: "",
        addCapitalization: true,
        addDigits: true,
        addSymbols: true,
        numReplacements: true
    };
    
    const cfgs = [cfg1, cfg2, cfg3, cfg4, cfg5, cfg6];
    for (let i = 1; i < 7; i++) {
        const results = [];
        for (let j = 0; j < 100; j++) {
            const passphrase = generatePassword(cfgs[i - 1]);
            const { score } = assessStrength(passphrase);
            results.push({ passphrase, score });
        }

        // calculate mean and median
        const scores = results.map(r => r.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const sorted = [...scores].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];

        const output = { mean, median, results};
        const outPath = path.join(__dirname, `passphrase_generation_results${i}.json`);
        
        await fs.writeFile(outPath, JSON.stringify(results, null, 2) + "\n", "utf8");
        await fs.writeFile(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");
    }

})().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
