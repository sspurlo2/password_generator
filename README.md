# Memorable Password Generator + Tester (Chrome Extension)

Group: Lily Spurgat, Sam Spurlock, Kate Spencer

## What it does
- Generates memorable passphrases using word banks + customization
- Generates random passwords (secure mode)
- Tests a password for common weaknesses (and supports optional leak checking)

## Development setup
1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

## Repo layout
- `extension/` Chrome extension code (Manifest V3)

## Roadmap
- Add real word bank selection + custom word lists (Options → storage)
- Implement leaked-password checking (hashed lookups or local dataset)
- Improve scoring model + explanations (usability-first output)

## Root Structure

```
extension/
├── _locales/           
│   └── en/             
│       └── messages.json
├── content_scripts/    
│   └── README.md
├── icons/              
│   └── icon_128.png    
├── options/           
│   ├── options.html
│   ├── options.css
│   └── options.js
├── popup/              
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── src/      
│   ├── background.js   
│   ├── generator.js    
│   ├── dictionary.json 
│   ├── leakedCheck.js  
│   ├── strength.js     
│   └── uiModel.js 
├── tests/ 
│   ├── clear_script.sh
│   ├── passphrase_generation_test.js
│   ├── random_generation_test.js
│   ├── README.md
│   └── run_test.sh
├── DIRECTORY_STRUCTURE.md
└── manifest.json
