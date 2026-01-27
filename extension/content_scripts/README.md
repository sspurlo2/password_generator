# Content Scripts

This directory is reserved for content scripts that can interact with web pages.

Content scripts run in the context of web pages and can:
- Read and modify the DOM
- Inject scripts into pages
- Communicate with the extension's background service worker

## Usage

If you need to add content scripts, add them here and reference them in `manifest.json`:

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["content_scripts/your-script.js"]
  }
]
```
