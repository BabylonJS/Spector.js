SpectorJS 
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

## Why
As a core member of the BabylonJS team I often found the need of debugging what is happening to my webgl context. I was a huge fan of webgl inspector until we introduced WebGl2 in Babylon. As the WebGL community as a whole is our focus, I thought it would be great to share an extension compatible with all the Webgl/Webgl2 engines available.

You can use the library inside of your own application easily. As it is transpiled as a UMD module, this will either work as a script reference or relying on you favorite bundling tools like webpack.

## Browser extension
If you are willing to use the browser extension instead, you can refer to the following documentation: [Browser Extension](https://github.com/BabylonJS/Spector.js/tree/master/documentation/extension.md).
<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionPopup.png" style="width:256px" width="256px">
</p>

## Use as a Module
In order to install the library in your application directory, please type the following commands on a command line prompt open on the application directory:

```
npm install spectorjs
```

From this point you are all set to use it in your app.

### Webpack sample
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

### CDN
Feel free to leverage the CDN to use the library from your own projets: [https://spectorcdn.babylonjs.com/2-5/spector.bundle.js](https://spectorcdn.babylonjs.com/2-5/spector.bundle.js)

### Repo
If you prefer to host your own version, the library is available in the [dist](https://github.com/BabylonJS/Spector.js/blob/master/dist/spector.bundle.js) folder of the repo.

### node_modules
If you used npm to install the library you can find the spector.bundle.js file in the node_module/spectorjs/dist folder. 

### How To Reference
Simply add the following tag in your html page header:

```html
<script type="text/javascript" src="spector.bundle.js"></script>
```

## Simple usage
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

## Available APIs
As the project is pretty new, the exhaustive list of APIs will not be detailed, only the most usefull and less subject to changes will.

### Namespace
The first thing to notice is the fact that the entire availables classes are living in a namespace called SPECTOR which is helpfull with the script referenced version.

### Events
All the the events discussed below can be attached to with the following code (example on an event named onEvent using a string event argument):

```
foo.onEvent.add(function(s) { console.log(s); };
// or for a context specific version to ensure console.log(s) will have "this" set to context; 
foo.onEvent.add(function(s) { console.log(s); }, context);
```

### SPECTOR.Spector
This is the main entry point of the library and contains the following methods:
- ```constructor()``` : creates a new instance.
- ```displayUI()``` : displays the embedded ui and begins to track the pages available canvas elements.
- ```getFps()``` : to get the current fps of the selected canvas.
- ```captureCanvas(canvas: HTMLCanvasElement)``` : to start a capture on a specific canvas.

And the following list of events:
- ```onCaptureStarted: IEvent<any>``` : triggered when a capture starts.
- ```onCapture: IEvent<ICapture>```: triggered when a new capture is available (this is a JSON only object containing alll the information).
- ```onError: IEvent<string>```: triggered when an error occured and return the error message.

As you notice you could usse the capture without displying the UI (this is the orientation we chosed in the browser extension).

### SPECTOR.CaptureMenu
This is the embedded capture menu you can see in the page helping selecting a canvas, capturing or playing/pausing the rendering. This can be use as a standalone component as it is done in the browser extension.

The prototype is subject to change but feel free to take a look at the available entry points here: [Spector.CaptureMenu](https://github.com/BabylonJS/Spector.js/blob/master/src/embeddedFrontend/captureMenu/captureMenu.ts)

<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/captureMenu.png" style="width:256px" width="256px">
</p>

### SPECTOR.ResultView
This is the embedded result view panel which displays the result of the different captured scenes.  This can be use as a standalone component as it is done in the browser extension.

The prototype is subject to change but feel free to take a look at the available entry points here: [Spector.ResultView](https://github.com/BabylonJS/Spector.js/blob/master/src/embeddedFrontend/resultView/resultView.ts)

<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionResult.png" style="width:512px" width="512px">
</p>

## How to build and use locally
Like any simple typescript repository everything start with.

```
git clone https://github.com/BabylonJS/Spector.js.git
cd spector
npm install
```

Then you can use the following npm commands to speed your development:
1. ```npm start``` Will compile and run a local server with a watch command so that you can directly try your changes (TS or scss). Navigate to the the [embedded sample](http://localhost:1337/sample/index.html) to start playing with the dev tools.
2. ```npm run build``` Will create and build a new version of the dist folder files.
3. ```npm run clean``` Will clean all the generated files from the repo.

If you are looking for the temporary generated .js or .map files, they are all available in the built folder which is not under source control.

I would recommend developping on [VsCode](https://code.visualstudio.com/) as the entire setup is present so that if you install the chrome debugger extension you can directly debug from your typescript files by pressing f5.

## Contribute
Any bugs are welcomed as Github issues. And if you are willing to help, do not hesitate to make a Pull Request.

## If you do not understand Spector or WebGL
I would advise you to check out and start with the Awesome [BabylonJS](http://www.babylonjs.com/) the community there will be more than happy to welcome anybody willing to learn Web 3d.

<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/babylonJS.png">
</p>