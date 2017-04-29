var fs = require('fs');
if (process.argv.length < 4) {
    console.log("Needs at least 2 args (source and target).");
}

function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled && cb) {
            cb(err);
            cbCalled = true;
        }
    }
}

var source = __dirname + process.argv[2];
var target = __dirname + process.argv[3];

console.log("Copy from: " + source);
console.log("To: " + target)

copyFile(source, target);