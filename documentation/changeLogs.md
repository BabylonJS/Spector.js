[SpectorJS](../readme.md)
=========

## Change Log
Please, find below the per release summary of the contribution added to the project per version. Each of the listed versions is having its corresponding tag in the repo.

## v0.2.3 Typos and MultiTabs
This simply contains another quick fix concerning typos in readme and the extension popup. As a little bonus, you can now capture to a new tab.

## v0.2.2 Viewport and Scissor Commands format
This simply contains another quick fix concerning the command formatting used in spector. It now does not display WebglConstants for both ```viewport``` and ```scissor```.

## v0.2.1 Capture Number format
This simply contains a quick fix concerning the number formatting used in spector. It now does not display trailing 0 in case of integers.

## v0.2.0 Frame Analytics and Texture Inputs
This release includes new data around like number of commands, memory and more texture types support:

- Analyse capture and extract number of calls per commands.
- Analyse records and extract memory information (Frame and global).
- Display Buffer and Render Buffer information.
- [Shader Display Repeat issue of some sections.](https://github.com/BabylonJS/Spector.js/issues/34)
- [Invalid Attrib Location Crash](https://github.com/BabylonJS/Spector.js/issues/33)
- [Compressed textures information](https://github.com/BabylonJS/Spector.js/issues/32)

[View More...](changeLogs/v0.2.0.md)

## v0.1.2 First Stable
This release is the first stable release containing the Minimum Valuable Product.

- [Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/spector-js/)
- npm version fix
- [Mipped Textures](https://github.com/BabylonJS/Spector.js/issues/31)
- [UBO Values](https://github.com/BabylonJS/Spector.js/issues/30)
- [Unspyed Mode](https://github.com/BabylonJS/Spector.js/issues/29)

[View More...](changeLogs/v0.1.2.md)

## v0.0.11 Fix Release
This release is aimed to address a few of the first created bugs:

- [Texture Inputs](https://github.com/BabylonJS/Spector.js/issues/1)
- Shader Beautyfier by [Temechon](https://github.com/Temechon)
- UX improvments
- [Sketchfab WebGL2 Crash](https://github.com/BabylonJS/Spector.js/issues/13)

[View More...](changeLogs/v0.0.11.md)

## v0.0.10 Initial Release
This is the first public release available. It conatains all the basic structure of the project and browser extension.

- Capture Framework.
- Embedded UI with Capture and Result View.
- Loose coupling View/Backend to enhance the reusability of components.
- WebGL 1/2 Supports.
- NPM package.
- Chrome, Firefox, and Edge Extension.

[View More...](changeLogs/v0.0.10.md)