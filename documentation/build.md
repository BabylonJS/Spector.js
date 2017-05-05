SpectorJS 
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
