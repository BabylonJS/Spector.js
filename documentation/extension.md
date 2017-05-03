SpectorJS
=========

## Summary
**Explore and Troubleshoot your WebGL scenes (All engines and Vanilla script support) with ease.**

Spector is a tool aim to *WebGl* developers willing to know what happens on their context. It enables capturing all the available information from a frame. You will be empowered to look at your entire **commands list** with their asoociated **visual states** and **context information**.

[![Build Status](https://travis-ci.org/BabylonJS/Spector.js.svg?branch=master)](https://travis-ci.org/BabylonJS/Spector.js)
[![Code Climate](https://codeclimate.com/github/BabylonJS/Spector.js.png)](https://codeclimate.com/github/BabylonJS/Spector.js)

<p align="center">
  <img src="https://spectordoc.babylonjs.com/pictures/title.png" style="width:512px">
</p>

## How to Install the extension
Please find below the link to the browser market places.
- [Chrome](https://chrome.google.com/webstore/detail/spectorjs/denbgaamihkadbghdceggmchnflmhpmk)

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
<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionResult.png" style="width:512px" width="512px">
</p>

## Use the standalone version
If you prefer to use the library in your own application you can find it available on npm: [spectorjs](https://www.npmjs.com/package/spectorjs)