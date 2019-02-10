// Old Fashion Way for IE 11 Devs. Yes, that still exists ;-)

var SPECTORTOOLS;
(function (SPECTORTOOLS) {
    var Loader = (function () {
        var useDist;
        var queue;
        var callback;

        function Loader() {
            queue = [];
            useDist = (document.location.href.toLowerCase().indexOf('dist=true') > 0);
            callback = null;
        }

        Loader.prototype.dequeue = function () {
            if (queue.length == 0) {
                if (callback) {
                    callback();
                }
                console.log('Scripts loaded');
                return;
            }

            var url = queue.shift();
            
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;

            var self = this;
            script.onload = function() {
                self.dequeue();
            };
            head.appendChild(script);
        }

        Loader.prototype.loadScript = function (url) {
            queue.push(url);
        }

        Loader.prototype.loadSPECTORScripts = function () {
            if (useDist) {
                this.loadScript("/dist/spector.bundle.js");
            }
            else {
                this.loadScript("/.temp/spector.bundle.js");
            }
        }

        Loader.prototype.onReady = function (newCallback) {
            callback = newCallback;
            return this;
        }

        Loader.prototype.load = function (scriptPaths) {
            var self = this;

            self.loadSPECTORScripts();

            if (scriptPaths) {
                for (var i = 0; i < scriptPaths.length; i++) {
                    var scriptPath = scriptPaths[i];
                    self.loadScript(scriptPath);
                }
            }
            
            self.dequeue();
        };

        return Loader;
    }());

    var loader = new Loader();
    SPECTORTOOLS.Loader = loader;

})(SPECTORTOOLS || (SPECTORTOOLS = {}))