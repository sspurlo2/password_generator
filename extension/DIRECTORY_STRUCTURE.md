# Directory Structure

This document describes the organization of the Chrome extension codebase.

## Root Structure

```
extension/
├── icons/              # Extension icons (16px, 48px, 128px)
├── _locales/           # Internationalization (i18n) files
│   └── en/            # English translations
│       └── messages.json
├── content_scripts/    # Content scripts for web page interaction
├── options/            # Options/settings page
│   ├── options.html
│   ├── options.css
│   └── options.js
├── popup/              # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── src/                # Core extension logic
│   ├── background.js   # Service worker (background script)
│   ├── generator.js    # Password generation logic
│   ├── strength.js     # Password strength assessment
│   ├── leakedCheck.js  # Leaked password checking
│   ├── storage.js      # Chrome storage API wrapper
│   └── uiModel.js      # UI model and word bank
├── tests/              # Test files
├── assets/             # Additional assets (images, fonts, etc.)
└── manifest.json       # Extension manifest

```

## Directory Descriptions

### `icons/`
Contains the extension icons in various sizes required by Chrome:
- `icon16.png` - Toolbar icon
- `icon48.png` - Extension management page
- `icon128.png` - Chrome Web Store

### `_locales/`
Internationalization support. Each language has its own subdirectory with a `messages.json` file containing translated strings.

### `content_scripts/`
Scripts that run in the context of web pages. Currently empty, but ready for future features like:
- Auto-filling password fields
- Password strength indicators on web forms
- Password suggestions

### `options/`
The extension's options/settings page that users can access via right-click → Options or chrome://extensions.

### `popup/`
The main UI that appears when users click the extension icon. Contains:
- Password generation interface
- Password strength testing interface

### `src/`
Core business logic separated from UI:
- **background.js**: Service worker for background tasks
- **generator.js**: Password generation algorithms (passphrase and random modes)
- **strength.js**: Password strength assessment and scoring
- **leakedCheck.js**: Integration with leaked password databases
- **storage.js**: Chrome storage API wrapper for settings
- **uiModel.js**: Word bank and cryptographic utilities

### `tests/`
Test files for unit, integration, and end-to-end testing.

### `assets/`
Additional static resources beyond icons (images, fonts, data files).

## File Organization Principles

1. **Separation of Concerns**: UI code (popup/, options/) is separate from business logic (src/)
2. **Modularity**: Each feature has its own module in `src/`
3. **Scalability**: Directory structure supports future growth (content scripts, tests, i18n)
4. **Chrome Extension Standards**: Follows Chrome extension best practices and conventions
