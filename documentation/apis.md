SpectorJS
=========

## Available APIs
As the project is pretty new, the exhaustive list of APIs will not be detailed, only the most usefull and less subject to changes will.

## Namespace
The first thing to notice is the fact that the entire availables classes are living in a namespace called SPECTOR which is helpfull with the script referenced version.

## Events
All the the events discussed below can be attached to with the following code (example on an event named onEvent using a string event argument):

```
foo.onEvent.add(function(s) { console.log(s); };
// or for a context specific version to ensure console.log(s) will have "this" set to context; 
foo.onEvent.add(function(s) { console.log(s); }, context);
```

## SPECTOR.Spector
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

## SPECTOR.CaptureMenu
This is the embedded capture menu you can see in the page helping selecting a canvas, capturing or playing/pausing the rendering. This can be use as a standalone component as it is done in the browser extension.

The prototype is subject to change but feel free to take a look at the available entry points here: [Spector.CaptureMenu](https://github.com/BabylonJS/Spector.js/blob/master/src/embeddedFrontend/captureMenu/captureMenu.ts)

<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/captureMenu.png" style="width:256px" width="256px">
</p>

## SPECTOR.ResultView
This is the embedded result view panel which displays the result of the different captured scenes.  This can be use as a standalone component as it is done in the browser extension.

The prototype is subject to change but feel free to take a look at the available entry points here: [Spector.ResultView](https://github.com/BabylonJS/Spector.js/blob/master/src/embeddedFrontend/resultView/resultView.ts)

<p align="center">
    <img src="https://spectordoc.babylonjs.com/pictures/extensionResult.png" style="width:512px" width="512px">
</p>