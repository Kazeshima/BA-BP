# Icons

Tauri requires icon files in this directory before building.

## Generate icons from a source image

1. Place a square PNG (at least 512×512) named `app-icon.png` in the project root.
2. Run:

```bash
npm run tauri icon ../app-icon.png
```

This will auto-generate all required icon sizes:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

## Quick placeholder (for testing only)

If you just want to build without a custom icon, you can use the Tauri default icons from:
https://github.com/tauri-apps/tauri/tree/dev/examples/api/src-tauri/icons

Copy those files into this directory before running `npm run tauri build`.
