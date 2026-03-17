[SpectorJS](../readme.md)
=========

## Safari Extension

Spector.js is available as a Safari Web Extension for macOS. Since Safari requires extensions to be wrapped in a native macOS app, the build process involves both npm and Xcode.

### Prerequisites

- macOS with Xcode installed (Xcode 14+)
- [Apple Developer account](https://developer.apple.com/) (required for distribution; not needed for local testing)
- Node.js and npm

### Building the Safari Extension

1. **Build the Spector.js bundle:**
   ```bash
   npm install
   npm run build
   ```
   This compiles the core library and copies `spector.bundle.js` into `safari-extension/`.

2. **Generate the Xcode project** (first time only):
   ```bash
   xcrun safari-web-extension-converter safari-extension/ \
     --project-location safari-xcode \
     --app-name "Spector.js" \
     --bundle-identifier com.babylonjs.spectorjs \
     --macos-only \
     --no-open
   ```
   This creates a macOS app project in `safari-xcode/` that wraps the web extension.

3. **Build and run from Xcode:**
   - Open `safari-xcode/Spector.js/Spector.js.xcodeproj` in Xcode
   - Select your development team under Signing & Capabilities
   - Build and run (⌘R)

### Development Workflow

1. **Enable unsigned extensions** in Safari:
   - Open Safari → Settings → Advanced → check "Show features for web developers"
   - Then Safari → Settings → Developer → check "Allow unsigned extensions"

2. **Build and run** the Xcode project — Safari will load the extension automatically.

3. **Iterate on extension code:** After editing files in `safari-extension/`, rebuild in Xcode (⌘R). For changes to the core Spector library in `src/`, run `npm run build` first.

4. **Test** using the sample pages at `http://localhost:1337/sample/index.html` (run `npm start` for the dev server).

### Architecture Differences from Chrome/Firefox

The Safari extension uses a single content script in the default ISOLATED world (Safari does not support Manifest V3's `"world": "MAIN"`). To interact with page-level JavaScript:

- **getContext() interception** and **Spector initialization** are injected into the page via `<script>` tags at runtime
- **Communication** between the injected page code and the extension uses CustomEvents and hidden DOM elements (same pattern as Chrome, just with explicit script injection)
- **browser.runtime APIs** are only called from the ISOLATED world content script, which bridges messages to/from the background service worker

### Distribution

Safari extensions are distributed via the Mac App Store:

1. Archive the Xcode project (Product → Archive)
2. Upload to App Store Connect
3. Submit for review

Refer to [Apple's documentation](https://developer.apple.com/documentation/safariservices/safari-web-extensions) for detailed distribution guidelines.

### Known Limitations

- **macOS only** — iOS/iPadOS support is not currently included (WebGL debugging is primarily a desktop use case)
- **`file://` URLs** — Safari has stricter restrictions on extension access to local files compared to Chrome
- **Unsigned extensions** must be re-enabled each time Safari is relaunched during development
