[SpectorJS](../readme.md)
=========

## Summary
**Explore and Troubleshoot your WebGL scenes (All engines and Vanilla script support) with ease.**

Spector is a tool aim to *WebGl* developers willing to know what happens on their context. It enables capturing all the available information from a frame. You will be empowered to look at your entire **commands list** with their asoociated **visual states** and **context information**.

[![Build Status](https://github.com/BabylonJS/Spector.js/workflows/CI/badge.svg)](https://github.com/BabylonJS/Spector.js/actions)
[![Code Climate](https://codeclimate.com/github/BabylonJS/Spector.js.png)](https://codeclimate.com/github/BabylonJS/Spector.js)

<p align="center">
  <img src="https://spectordoc.babylonjs.com/pictures/title.png" style="width:512px">
</p>

## How to Install the extension
Please find below the link to the browser market places.
- [Chrome](https://chrome.google.com/webstore/detail/spectorjs/denbgaamihkadbghdceggmchnflmhpmk)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/spector-js/)

As it is not currently deployed to all the browser extension store, you can easily sideload it in your browser of choice. This is also the recommended approach to contribute to the extension code.

### Install in Chrome
1. Navigate to [Chrome Extensions](chrome://extensions/)
2. Enable the developer Mode (Checkbox on the top right of the extension page)
3. Cick on the Load Unpacke Extension (Button on the top left of the extension page)
    <p align="center">
        <img src="https://spectordoc.babylonjs.com/pictures/chromeExtension.png" style="width:512px" width="512px">
    </p>
4. Select the folder *extensions* from the cloned repository.
5. You are all set.

### Install in Firefox
1. Navigate to [Firefox Add Ons](about:addons)
2. Click settings and Debug Add-ons.
3. Cick on the Load Unpacked Extension (Button on the top left of the extension page)
    <p align="center">
        <img src="https://spectordoc.babylonjs.com/pictures/firefoxAddons.png" style="width:512px" width="512px">
    </p>
4. Click on load temporary Add-on.
5. Select the folder *extensions* from the cloned repository.
6. You are all set. 

### Install on Edge
1. Navigate to [Flags](about:flags)
2. Enable extension developer feature.
    <p align="center">
        <img src="https://spectordoc.babylonjs.com/pictures/edgeExtensionDeveloper.png" style="width:256px" width="256px">
    </p>
4. In the settings menu click on Extensions.
    <p align="center">
        <img src="https://spectordoc.babylonjs.com/pictures/edgeExtensions.png" style="width:256px" width="256px">
    </p>
5. Click on Load extension.
    <p align="center">
        <img src="https://spectordoc.babylonjs.com/pictures/edgeLoadExtension.png" style="width:256px" width="256px">
    </p>
5. Select the folder *extensions* from the cloned repository.
6. You are all set.

### How To Use
For a complete tutorial, you can refere to the following [Real time rendering article](http://www.realtimerendering.com/blog/debugging-webgl-with-spectorjs/).

You can now on navigate to any website using webgl like the [Babylon JS playground](http://www.babylonjs-playground.com/?6) and you will notice the extension Icon turning red in the toolbar.
<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionAvailable.png">
</p>

This means a canvas with a 3d context has been detected in one of the page frames. From this point you can inject all the required capture tooling in the page by pressing the toolbar button. This will reload the page and the icon should turn green as it is enabled.
<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionEnabled.png">
</p>

Now a click on the button will display a popup helping you capturing frames.
<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionPopup.png" style="width:256px" width="256px">
</p>

Following the on screen instructions and clicking the red button will trigger a capture. You can also, in this menu, if a canvas is selected pause or play frame by frame the rendered canvas. Once the capture has been completed, a result panel will be displayed containing all the information you may need.

The bottom of the menu helps capturing what is happening during the page load on the first canvases present in the document. You can easily chose the number of command to capture as well as specify wether or not you would like to capture transient context (context created in the first canvas even if not part of the DOM).
<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionResult.png" style="width:512px" width="512px">
</p>

Another interesting feature is the ability to drive the extension by code. Once the extension is enabled, from your browser's dev tools, or even your code, you can call the following APIs on spector:
- ```captureNextFrame(obj: HTMLCanvasElement | RenderingContext)``` : Call to begin a capture of the next frame of a specific canvas or context.
- ```startCapture(obj: HTMLCanvasElement | RenderingContext, commandCount: number)``` : Start a capture on a specific canvas or context. The capture will stop once it reaches the number of commands specified as a parameter, or after 10 seconds.
- ```stopCapture(): ICapture``` : Stop the current capture and returns the result in JSON. It displays the result if the UI has been displayed. This returns undefined if the capture has not been completed or did not find any commands.
- ```setMarker(marker: string)``` : Adds a marker that is displayed in the capture, helping you analyze the results.
- ```clearMarker()``` : Clears the current marker from the capture for any subsequent calls.

The ```spector``` object is available on the window for this purpose.

This can be a tremendous help to capture the creation of your shadow maps, for instance. This can also be used to trigger a capture based on a user interaction or to set markers in your code to better analyse the capture.

The following example could be introduced safely in your code:
```
if (spector) {
    spector.setMarker("Shadow map creation");
}
[your shadow creation code]
if (spector) {
    spector.clearMarker();
}
```

### Shader Editor
Spector is embedding a live shader editor for **supporting engines**. Unfortunately,managing in Spector all the necessary steps once a program has been rebuild (binding the old uniforms, attribs, UBO, VAO... redirecting new bound values to old location) is really **unreliable** and has been proved REALLY error prone. We then decided to not do it in Spector but **defer to the engines the responsibility of rebuilding the programs**.

If, like BabylonJS, you would like to be able to integrate live shader support edition in your WebGL engine, it is pretty straightforward.

At any time you are linking a ```ShaderProgram``` in your engine, simply append to it a **rebuild function** allowing your engine to recompile the shader as well as managing all the different states associated to it. The signature of the function should be as follow to be called by Spector:
```
rebuildProgram(vertexSourceCode: string, // The new vertex shader source
            fragmentSourceCode: string, // The new fragment shader source
            onCompiled: (program: WebGLProgram) => void, // Callback triggered by your engine when the compilation is successful. It needs to send back the new linked program.
            onError: (message: string) => void): void; // Callback triggered by your engine in case of error. It needs to send the WebGL error to allow the editor to display the error in the gutter.
```

Once the function has been defined simply append it to your freshly linked WebGLPrograms:
```
// program is the linked WebglProgram that Babylon is expanding
// with a custom rebuild function.
// Noticed we bind the context to ensure it runs as part of your engine and not the program itself.
program.__SPECTOR_rebuildProgram = this._rebuildProgram.bind(this);
```

## Use the standalone version
If you prefer to use the library in your own application you can find it available on npm: [spectorjs](https://www.npmjs.com/package/spectorjs)
