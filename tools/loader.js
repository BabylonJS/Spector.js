// Old Fashion Way for IE 11 Devs. Yes, that still exists ;-)

var SPECTORTOOLS;
(function (SPECTORTOOLS) {
    
    var getJson = function(url, callback, errorCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                var data = JSON.parse(xhr.response);
                callback(data)
            } else {
                errorCallback({
                status: this.status,
                statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            errorCallback({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    }

    var Loader = (function () {
        var queue;

        var useDist;
        var useBundle;

        var spectorJSPath;
        var config;
        
        var callback;

        function Loader() {
            queue = [];

            useBundle = (document.location.href.toLowerCase().indexOf('bundle=true') > 0);
            useDist = (document.location.href.toLowerCase().indexOf('dist=true') > 0);  

            spectorJSPath = '';
            
            callback = null;
        }

        Loader.prototype.root = function (newSpectorJSPath) {
            spectorJSPath = newSpectorJSPath;
            return this;
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

        Loader.prototype.loadCss = function (url) {
            var head = document.getElementsByTagName('head')[0];

            var style = document.createElement('link');
            style.href = url;
            style.rel = "stylesheet";
            style.type = "text/css"
            document.head.appendChild(style);
        }

        Loader.prototype.loadScripts = function (urls) {
            for (var i = 0; i< urls.length; i++) {
                this.loadScript(urls[i]);
            }
        }

        Loader.prototype.loadSPECTORScripts = function () {
            var config = this.config;
            if (useBundle) {
                this.loadScript(spectorJSPath + config.dist.bundle);
            }
            else if (useDist) {
                this.loadScript(spectorJSPath + config.dist.js);
                this.loadCss(spectorJSPath + config.dist.css);
            }
            else {
                var i = 0;
                var date = new Date();
                for (; i < config.src.typescript.length; i++) {
                    var file = config.src.typescript[i];
                    if (file.indexOf('.d.ts') > 0) {
                        continue;
                    } 

                    file = file.replace('.ts', '.js?' + date.getTime());
                    file = spectorJSPath + config.build.temp + file;
                    this.loadScript(file);
                }

                for (i = 0; i < config.src.css.length; i++) {
                    var file = config.src.css[i];
                    file = file.replace('.scss', '.css?' + date.getTime());
                    file = spectorJSPath + config.build.temp + file;
                    this.loadCss(file);
                }
            }
        }

        Loader.prototype.onReady = function (newCallback) {
            callback = newCallback;
            return this;
        }

        Loader.prototype.load = function (scriptPath) {
            var self = this;
            self.config = {
                "dist": {
                    "css": "/dist/spector.css",
                    "js": "/dist/spector.js",
                    "bundle": "/dist/spector.bundle.js"
                },
                "build": {
                    "temp": "/built/"
                },
                "src": {
                    "typescriptConfig": "/src/tsconfig.json"
                }
            };

            getJson(self.config.src.typescriptConfig,
                function(data) {
                    self.config.src.typescript = data.files;
                    self.config.src.css = data.cssFiles;
                    
                    self.loadSPECTORScripts();

                    if (scriptPath) {
                        self.loadScript(scriptPath);
                    }
                    
                    self.dequeue();
                },
                function(reason) { 
                    console.error(reason);
                }
            );
        };

        return Loader;
    }());    

    var loader = new Loader();
    SPECTORTOOLS.Loader = loader;

})(SPECTORTOOLS || (SPECTORTOOLS = {}))