var path = require("path");

var MAIN_DIR = path.resolve(__dirname, "../");
var BUILD_DIR = path.resolve(MAIN_DIR, "./dist");
var DEV_DIR = path.resolve(MAIN_DIR, "./.temp");

var buildConfig = function(env) {
    var isProd = env === "prod";
    var config = {
        watch: !isProd,
        context: MAIN_DIR,
        entry: [
            "./vendors/ace.js",
            "./vendors/ace-mode-glsl.js",
            "./vendors/ace-theme-monokai.js",
            "./vendors/ace-theme-override.css",
            "./vendors/ace-ext-searchbox.js",
            "./src/spector.ts"
        ],
        output: {
            path: isProd ? BUILD_DIR : DEV_DIR,
            publicPath: "/",
            filename: "spector.bundle.js",
            libraryTarget: "umd",
            library: "SPECTOR",
            umdNamedDefine: true
        },
        performance: {
            hints: false
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".css", ".sass"]
        },
        devtool: isProd ? "none" : "source-map",
        mode: isProd ? "production" : "development",
        module: {
            rules: [{
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                options: {
                    configFileName: "src/tsconfig.json",
                    declaration: false
                }
            }, {
                test: /\.scss$/,
                use: [ "style-loader?insert=html", "css-loader", "sass-loader" ]
            }, {
                test: /\.css$/,
                use: [ "style-loader?insert=html", "css-loader" ]
            }, {
                test: /ace.js$/,
                use: [ "exports-loader?ace" ]
            }, {
                test: /spector.js$/,
                use: [ "exports-loader?SPECTOR" ]
            }]
        }
    };

    if (!isProd) {
        config.devtool = "nosources-source-map";

        // Source Map Remapping for dev tools.
        config.output.devtoolModuleFilenameTemplate = (info) => {
            info.resourcePath = path.normalize(info.resourcePath);

            console.error(info.resourcePath);

            // if (!path.isAbsolute(info.resourcePath)) {
            //     info.resourcePath = path.join(DEV_DIR, info.resourcePath);
            // }

            return `../${info.resourcePath.replace(/\\/g, "/")}`;
        };
    }

    return config;
}

module.exports = buildConfig;
