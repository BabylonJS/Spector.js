[SpectorJS](../readme.md)
=========

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

I would recommend developping on [VsCode](https://code.visualstudio.com/) as the entire setup is present so that if you install the chrome debugger extension you can directly debug from your typescript files by pressing F5.

As Tslint is part of the build checks, please run it locally before any PR. The easiest is to install the TsLint plugin in VsCode.
```npm run build:tslint```

## Available Samples
Once ```npm start``` has been launched, you can access the following samples to try your new features:

### Error Handling
1. [Exception](http://localhost:1337/sample/index.html?sample=lightsException): Test of exception during capture.
2. [No Render](http://localhost:1337/sample/index.html?sample=lightsNoRender): Test to capture if no frame are detected.
3. [No command](http://localhost:1337/sample/index.html?sample=simpleNoCommand): Simple use case containing a frame with no webgl commands.

### Valid Use Cases
1. [Simple](http://localhost:1337/sample/index.html?sample=simple): A basic use case validating state changes.
2. [Lights](http://localhost:1337/sample/index.html?sample=lights): Simple BabylonJS scene with three lights.
3. [Texture 2d](http://localhost:1337/sample/index.html?sample=texture2d): BabylonJS scene containing materials with texture.
4. [Texture cube](http://localhost:1337/sample/index.html?sample=textureCube): BabylonJS scene containing a cube texture.
5. [Render Target Texture](http://localhost:1337/sample/index.html?sample=renderTargetTexture): Test to do a capture containing render target textures.
6. [Float Render Target Texture](http://localhost:1337/sample/index.html?sample=floatRenderTargetTexture): Test to do a capture containing float render target textures.
7. [MSAA Render Buffer](http://localhost:1337/sample/index.html?sample=msaaRenderBuffer): Test to do a capture containing an msaa render buffer.
8. [Buffer View Texture](http://localhost:1337/sample/index.html?sample=bufferViewTexture): Test to do a capture containing a cube texture created from bufferview data.
9. [Instanced](http://localhost:1337/sample/index.html?sample=instanced): Test to do a capture of instanced objects.
10. [Float sized FrameBuffer](http://localhost:1337/sample/index.html?sample=floatSizedFrameBuffer): Test to do a capture containing a none integer based sized FrameBuffer.
11. [Uniform Command](http://localhost:1337/sample/index.html?sample=uniformCommand): Test to do a capture a uniform with a value matching a webgl constant.
12. [Custom Metadata](http://localhost:1337/sample/index.html?sample=customMetadata): Test to do a capture containing custom metadata.
13. [Custom Marker](http://localhost:1337/sample/index.html?sample=customMarker): Test to do a capture containing custom marker.
14. [Custom Shader Name in define SHADER_NAME](http://localhost:1337/sample/index.html?sample=customShaderName): Test to do a capture containing custom marker.
15. [Uniform Array](http://localhost:1337/sample/index.html?sample=uniformArray): Test to do a capture containing uniform array values.
16. [Quick Capture](http://localhost:1337/sample/index.html?sample=quickCapture): Test to do a quick capture not containing visual states.
17. [Depth Range](http://localhost:1337/sample/index.html?sample=depthRange): Test redundant depth range states.
18. [setTimeout Parameters](http://localhost:1337/sample/index.html?sample=setTimeout): Test parameters of setTimeout functions.
19. [Viewport](http://localhost:1337/sample/index.html?sample=viewPort): Test viewport capture in Render Targets.
20. [Offscreen](http://localhost:1337/sample/index.html?sample=offscreen): Test Offscreen canvas support.

You can also add &noSpy=1 at the end of the previous Urls to test without enabling the full spy before starting your rendering engine.

### Add more samples
To add a new sample, simply add a new script in the ```sample/js``` folder. To launch it you can use the following url by replacing the ```fileName``` by your new file name without the ```.js``` extension.

[http://localhost:1337/sample/index.html?sample=fileName](http://localhost:1337/sample/index.html?sample=fileName)

## Extension
As stated on the [extension documentation](extension.md), you can side load the extension. The main use cases to try out to test the captures are:

- [BabylonJS playground](http://www.babylonjs-playground.com/): Test a few of the available scenes.
- [Sketchfab](https://sketchfab.com/models/09f6d0e4d611421bbd53d35f1ef013ec)
- [Sketchfab WebGL 2](https://sketchfab.com/models/4d9f1a93a4a04b08aec30a8f2f9c6fa2?webgl2=1)
- [Play Canvas Over the flood](https://playcanv.as/e/p/44MRmJRU/)
- [5000 Commands](http://marcinignac.com/experiments/deferred-rendering/demo/)