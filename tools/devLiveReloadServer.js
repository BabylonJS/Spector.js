var httpServer = require('http-server');
var fs = require('fs');
var liveReload = require('livereload');

if (process.argv.length < 3) {
    console.log("Needs at least 1 argument (path)");
}

var server = httpServer.createServer();
server.listen(1337);

var liveReloadServer = liveReload.createServer();

console.log(__dirname + process.argv[2]);
liveReloadServer.watch(__dirname + process.argv[2]);