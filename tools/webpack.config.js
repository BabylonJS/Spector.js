var path = require("path");

var MAIN_DIR = path.resolve(__dirname, "../");
var BUILD_DIR = path.resolve(MAIN_DIR, "./dist");
var DEV_DIR = path.resolve(MAIN_DIR, "./.temp");

var buildConfig = function(env) {
    var isProd = env.prod;

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
        devtool: false,
        mode: isProd ? "production" : "development",
        module: {
            rules: [{
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    configFile: "src/tsconfig.json"
                }
            }, {
                test: /\.scss$/,
                use: [
                    { loader: "style-loader", options: { insert: "html" } },
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {
                                silenceDeprecations: ["import", "global-builtin", "color-functions"],
                            },
                        },
                    },
                ]
            }, {
                test: /\.css$/,
                use: [ { loader: "style-loader", options: { insert: "html" } }, "css-loader" ]
            }, {
                test: /ace.js$/,
                // use: [ "exports-loader?ace" ]
                loader: "exports-loader",
                options: {
                    type: "commonjs",
                    exports: "ace",
                },
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
