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
6. [Buffer View Texture](http://localhost:1337/sample/index.html?sample=bufferViewTexture): Test to do a capture containing a cube texture created from bufferview data.
7. [Custom Metadata](http://localhost:1337/sample/index.html?sample=customMetadata): Test to do a capture objects containing metadata.

### Add more samples
To add a new sample, simply add a new script in the ```sample/js``` folder. To launch it you can use the following url by replacing the ```fileName``` by your new file name without the ```.js``` extension.

[http://localhost:1337/sample/index.html?sample=fileName](http://localhost:1337/sample/index.html?sample=fileName)