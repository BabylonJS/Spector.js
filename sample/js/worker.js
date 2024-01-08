importScripts('/tools/loader.js');

importScripts('/sample/assets/js/sylvester.js');
importScripts('/sample/assets/js/glUtils.js');
importScripts('/sample/assets/js/babylon.max.js');
importScripts('/sample/assets/js/babylon.objFileLoader.js');


// Allow querystring to navigate easily in debug in local samples.
var indexjs = '/sample/js/';
var sampleSearch = /sample=([0-9-zA-z]+)/i;
var matches = null;
if ((matches = sampleSearch.exec(globalThis.location)) !== null) {
    indexjs += matches[1];
}
else {
    indexjs += 'lights';
}
indexjs += '.js';

spector = null;

// Load the scripts + map file to allow vscode debug.
SPECTORTOOLS.Loader
    .onReady(function () {
        console.log('All loaded.');
    })
    .load(['/sample/assets/js/injectSpector.js', indexjs]);