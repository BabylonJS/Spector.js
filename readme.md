[SpectorJS](readme.md) 
=========

## Summary
**Explore and Troubleshoot your WebGL scenes (All engines and Vanilla script support) with ease.**

Spector is a tool aim to *WebGl* developers willing to know what happens on their context. It enables capturing all the available information from a frame. You will be empowered to look at your entire **commands list** with their asoociated **visual states** and **context information**.

[![Build Status](https://travis-ci.org/BabylonJS/Spector.js.svg?branch=master)](https://travis-ci.org/BabylonJS/Spector.js)
[![Code Climate](https://codeclimate.com/github/BabylonJS/Spector.js.png)](https://codeclimate.com/github/BabylonJS/Spector.js)

This can be used either as a *browser extension* or directly from your page a a *Standalone Version*.

<p align="center">
  <img src="https://spectordoc.babylonjs.com/pictures/title.png" style="width:512px">
</p>

## Table of Content
* [Why](#why)
* [Browser extension](#browser-extension)
* [Use as a Module](#use-as-a-module)
  * [Webpack sample](#webpack-sample)
* [Use as a Script Reference](#use-as-a-script-eference)
  * [CDN](#cdn)
  * [From the repository](#repo)
  * [Node_Modules](#node_modules)
  * [How To Reference](#how-to-reference)
* [Basic usage](#basic-usage)
* [Custom data](#custom-data)
* [Available APIs](documentation/apis.md)
* [Build Locally](documentation/build.md)
* [Contribute](documentation/contribute.md)
* [ChangeLog](documentation/changeLogs.md)
* [Learn WebGl](#learn-about-webgl)

## Why
###### [Back to top](#table-of-content)
As a core member of the BabylonJS team I often found the need of debugging what is happening to my webgl context. I was a huge fan of webgl inspector until we introduced WebGl2 in Babylon. As the WebGL community as a whole is our focus, I thought it would be great to share an extension compatible with all the Webgl/Webgl2 engines available.

You can use the library inside of your own application easily. As it is transpiled as a UMD module, this will either work as a script reference or relying on you favorite bundling tools like webpack.

## Browser extension
###### [Back to top](#table-of-content)
If you are willing to use the browser extension instead, you can refer to the following documentation: [Browser Extension](https://github.com/BabylonJS/Spector.js/tree/master/documentation/extension.md).

Or you can direclty install it from the store:
- [Chrome](https://chrome.google.com/webstore/detail/spectorjs/denbgaamihkadbghdceggmchnflmhpmk)

<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionPopup.png" style="width:256px" width="256px">
</p>

## Use as a Module
###### [Back to top](#table-of-content)
In order to install the library in your application directory, please type the following commands on a command line prompt open on the application directory:

```
npm install spectorjs
```

From this point you are all set to use it in your app.

### Webpack sample
###### [Back to top](#table-of-content)
As a quick demo, here is a simple way to use the spector module with webpack.

Please follow the instrctions below which are creating a new directory and installing the required tools:

```
mkdir sample
cd sample
npm init
npm install webpack --save-dev
npm install spectorjs --save-dev
```

Following the HelloWorld example from Webpack, you can now create in the sample folder:

A js file named entry.js containing the following code:

```javascript
var SPECTOR = require("spectorjs");

var spector = new SPECTOR.Spector();
spector.displayUI();
```

And an html file named index.js containing the following code:

```html
<html>
    <head>
    </head>
    <body>
        <script type="text/javascript" src="bundle.js" charset="utf-8"></script>
    </body>
</html>
```

Now your application is ready, go back to your command line and bundle the javascript file:

```
webpack entry.js bundle.js
```

You are all set, you can open your index.html file and see the inspector running. It will obviously won't be that usefull on an empty page but at least you get the integration idea.

## Use as a Script Reference
###### [Back to top](#table-of-content)

### CDN
Feel free to leverage the CDN to use the library from your own projets: [https://spectorcdn.babylonjs.com/spector.bundle.js](https://spectorcdn.babylonjs.com/spector.bundle.js)

### Repo
If you prefer to host your own version, the library is available in the [dist](https://github.com/BabylonJS/Spector.js/blob/master/dist/spector.bundle.js) folder of the repo.

### node_modules
If you used npm to install the library you can find the spector.bundle.js file in the node_module/spectorjs/dist folder. 

### How To Reference
Simply add the following tag in your html page header:

```html
<script type="text/javascript" src="spector.bundle.js"></script>
```

## Basic Usage
###### [Back to top](#table-of-content)
Once available in your app, you can instantiate an inspector by inserting the following command in your script:

```javascript
var spector = new SPECTOR.Spector();
```

You can then display the embedded UI directly in your page:

```javascript
spector.displayUI();
```

Or launch a capture and reuse its JSON result at your will:

```javascript
spector.onCapture.add((capture) => {
    // Do something with capture.
    var myEvent = new CustomEvent("SpectorOnCaptureEvent", { detail: { captureString: JSON.stringify(capture) } });
    document.dispatchEvent(myEvent);
});

var canvas = document.getElementById("renderCanvas");
spector.captureCanvas(canvas);
```

Another api you can rely upon is:

```javascript
spector.spyCanvases();
```

This will enable a complete tracking of the gl calls even before capturing which enables for instance access to the texture inputs or memory consumption information.

## Custom Data
###### [Back to top](#table-of-content)
You can simply add custom data to the capture by adding a special field named **__SPECTOR_Metadata** to your WebGLObjects.

```javascript
var cubeVerticesColorBuffer = gl.createBuffer();
cubeVerticesColorBuffer.__SPECTOR_Metadata = { name: "cubeVerticesColorBuffer" };
```

This will enable the visibility of your custom name in your capture. This can be an invaluable asset during troubleshoot session. This can also help referencing your materials friendly names from your captures.

## Learn About WebGL
###### [Back to top](#table-of-content)
I would advise you to check out and start with the Awesome [BabylonJS](http://www.babylonjs.com/) the community there will be more than happy to welcome anybody willing to learn Web 3d.

<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/babylonJS.png">
</p>