[SpectorJS](../readme.md)
=========

## Change Log
Please, find below the per release summary of the contribution added to the project per version. Each of the listed versions is having its corresponding tag in the repo.

## v0.9.30
* Fix [Scissor function call](https://github.com/BabylonJS/Spector.js/issues/266)
* Fix [bufferSubData and getAttribLocation number report](https://github.com/BabylonJS/Spector.js/issues/262)
* Fix [Dataview representation](https://github.com/BabylonJS/Spector.js/issues/263)
* Fix [Multidraw spy](https://github.com/BabylonJS/Spector.js/issues/253)
* Fix [Preprocessor beautify](https://github.com/BabylonJS/Spector.js/pull/272)
* Fix [Float buffer capture](https://github.com/BabylonJS/Spector.js/pull/276)
* Add [Beautifier Toggle](https://github.com/BabylonJS/Spector.js/pull/282)
* Fix [BaseVertexBaseInstance Capture](https://github.com/BabylonJS/Spector.js/pull/284)
* Fix [XR spy on firefox](https://github.com/BabylonJS/Spector.js/pull/285)

## v0.9.29
* Add [WebXR tracking capabilities](https://github.com/BabylonJS/Spector.js/pull/257)
* Fix [Stencil functions could crash](https://github.com/BabylonJS/Spector.js/issues/66)
* Fix [Warning on Spy](https://github.com/BabylonJS/Spector.js/issues/246)

## v0.9.28
* Fix [BindAttribLocation parameter display](https://github.com/BabylonJS/Spector.js/issues/220)
* Fix [Scissor redundant calls on clear](https://github.com/BabylonJS/Spector.js/issues/215)
* Fix [Stencil command consistency](https://github.com/BabylonJS/Spector.js/issues/213)
* Fix [STENCIL_BITS is not displayed in stencil state](https://github.com/BabylonJS/Spector.js/issues/214)
* Add [spector.log support](https://github.com/BabylonJS/Spector.js/issues/171)
* Fix [Shader Type display](https://github.com/BabylonJS/Spector.js/issues/179)
* Add [Pixelated Texture on Nearest mag filter](https://github.com/BabylonJS/Spector.js/issues/107)
* Fix [Texture Display for texture arrays](https://github.com/BabylonJS/Spector.js/pull/224)
* Fix [texture capture with texStorage2D](https://github.com/BabylonJS/Spector.js/issues/227)
* Fix Search field in the UI.

## v0.9.27
* Fixed compressed textures gathered sizes.

## v0.9.26
* Add support for SRGB textures capture.

## v0.9.25
* [Fix Drag and Drop captures in the main extension popup](https://github.com/BabylonJS/Spector.js/issues/199)

## v0.9.24
* Chrome web Store policy change

## v0.9.22
* Display [elementArrayBuffer in capture state](https://github.com/BabylonJS/Spector.js/issues/180)

## v0.9.19 && v0.9.20 && v0.9.21
* Add Support for [translated shaders](https://github.com/BabylonJS/Spector.js/issues/175) in the extension.

## v0.9.18
* Add Toggle for [fullscreen textures](https://github.com/BabylonJS/Spector.js/issues/145) in the extension.

## v0.9.17
* Fix [Recording of deleted Shaders](https://github.com/BabylonJS/Spector.js/issues/145)
* Icons Rebranding

## v0.9.15
* Fix [Texture memory information](https://github.com/BabylonJS/Spector.js/issues/140)

## v0.9.14
* Fix [Offscreen Canvas not defined](https://github.com/BabylonJS/Spector.js/issues/137)

## v0.9.13 Fix
* Fix [Prism Leak](https://github.com/BabylonJS/Spector.js/issues/133)
* [Enable/Disable attributes comments](https://github.com/BabylonJS/Spector.js/pull/134)
* [UBO values](https://github.com/BabylonJS/Spector.js/pull/135)

## v0.9.12 Fix
* Fix Viewport capture issues.
* Fix Frame Buffer Texture Array capture issues.
* [Fix Offscreen canvas support on the main thread.](https://github.com/BabylonJS/Spector.js/issues/90)

## v0.9.11 Mozilla
Upgrade Vendors to help deliver on Mozilla add-ons.

## v0.9.10 HREF conservation
[Do not change URL by clicking on close](https://github.com/BabylonJS/Spector.js/issues/118)

## v0.9.9 Mozilla
Upgrade Mozilla Build.

## v0.9.8 CSS
Fix menu CSS due to Chrome CSS interpretation changes.

## v0.9.7 Shader Beautifier
This addresses one bug fix: [comments are displayed with a different indentation](https://github.com/BabylonJS/Spector.js/issues/100)

## v0.9.6 Modules
All the code has been simplified and migrated to modules to ease the contributions. Next step will be to migrate the frontend to a none custom framework.

This also addresses one bug fix: [shader beautifier issue with curly in comments](https://github.com/BabylonJS/Spector.js/issues/100)

## v0.9.5 Bug Fix and Capture by Command Count
This minor release is adding the capability to capture a certain amount of commands instead of a frame. This can help in case commands are called outside the RAF event.

This also addresses one bug fix: [drawArraysInstancedANGLE is not recognized](https://github.com/BabylonJS/Spector.js/issues/92)

## v0.9.4 Memory Leak Fix
This release is fixing a memory leak introduced through the 0.9.3 version in the extension:
- [Do not Retain Canvas/Context in extension to prevent memory leaks](https://github.com/BabylonJS/Spector.js/issues/87)

## v0.9.3 Fixes
This release is meant to address the few bugs found during a bug bash session:
- Semicolon replaced by dot in Shader comment.
- Fix Pause/Replay buttons.
- Fix XHR Warning in the extension.
- [Fix setTimeout/setInterval parameters](https://github.com/BabylonJS/Spector.js/issues/81).
- [Capture off screen canvases](https://github.com/BabylonJS/Spector.js/issues/85).
- Fix Extension list report in Webgl 2.

## v0.9.2 Chrome Canary
This release is addressing an issue with the post message size limit in Chrome Canary:
- [Chrome canary post message Size Limit](https://github.com/BabylonJS/Spector.js/issues/71)
- [Uniform capture with native array](https://github.com/BabylonJS/Spector.js/issues/72)
- Shader Editor Style Fix.

## v0.9.1 Before V1
This release is addressing the latest issues before the V1 as well as embedding a shader editor:

- [Programmatic Capture do not open in a new tab](https://github.com/BabylonJS/Spector.js/issues/61)
- [Fix memory reporting of buffers](https://github.com/BabylonJS/Spector.js/issues/64)
- [Fix Capture Download in IE11](https://github.com/BabylonJS/Spector.js/issues/65)
- [Workaround perf and memory issue with a quick capture mode](https://github.com/BabylonJS/Spector.js/issues/67)
- [Fix Depth Range comparison](https://github.com/BabylonJS/Spector.js/issues/68)
- [Hook on WebVR Display RAF](https://github.com/BabylonJS/Spector.js/issues/62)
- [Fix Firefox Linux Charset Issue](https://github.com/BabylonJS/Spector.js/issues/70)
- [Embedded Live Shader Editor](https://github.com/BabylonJS/Spector.js/blob/release/documentation/extension.md#shader-editor)

## v0.9.0 Fix and Style
This realease is meant to improve the overall stability and compatibility with other extension:

- [Workaround Firefox security issue relying on apply](https://github.com/BabylonJS/Spector.js/issues/37)
- Fix Uniform Array Capture
- [Allow Transient Context capture on reload](https://github.com/BabylonJS/Spector.js/issues/60)
- Add number of commands to capture on reload
- Integrate new logo
- Add more intuitive public programmatic APIs for capture.

## v0.3.0 Fix
This realease enables fixes a couple of reported issues:

- Fix memory usage report.
- Add MSAA render buffer capture.
- [Add Primitives Count per type](https://github.com/BabylonJS/Spector.js/issues/43).
- [Allow capture of float based width/height of FrameBuffer](https://github.com/BabylonJS/Spector.js/issues/52)
- [Fix uniform command Format](https://github.com/BabylonJS/Spector.js/issues/50)
- [Better Stacktrace support on Firefox](https://github.com/BabylonJS/Spector.js/issues/47)
- [Integrate Custom Marker](https://github.com/BabylonJS/Spector.js/issues/45)
- [Fix Enable/Disable vertex attrib command format](https://github.com/BabylonJS/Spector.js/issues/55)
- [Add Programmatic Capture](https://github.com/BabylonJS/Spector.js/issues/46)
- Add capture on Load in the extension.
- Open the extension in a new tab by default.
- [Shaders + properties are visible at the same time](https://github.com/BabylonJS/Spector.js/issues/59)
- [Introduce keyboard navigation](https://github.com/BabylonJS/Spector.js/issues/54)
- [Display SHADER_NAME in draw calls](https://github.com/BabylonJS/Spector.js/issues/53)
- [Add link to shaders in draw calls](https://github.com/BabylonJS/Spector.js/issues/53)

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
