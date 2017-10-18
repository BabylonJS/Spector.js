module.exports = {
    entry: [
        "./dist/spector.css",
        "./dist/prism.css",
        "./dist/prism.js",
        "./dist/ace.js",
        "./dist/spector.js"
    ],
    output: {
        filename: './dist/spector.bundle.js',
        libraryTarget: "umd",
        library: "SPECTOR",
        umdNamedDefine: true
    },  
    module: {
        rules: [{
            test: /\.css$/,
            use: [ 'style-loader?insertInto=html', 'css-loader' ]
        }, {
            test: /prism.js$/,
            use: [ 'exports-loader?Prism' ]
        }, {
            test: /ace.js$/,
            use: [ 'exports-loader?ace' ]
        }, {
            test: /spector.js$/,
            use: [ 'exports-loader?SPECTOR' ]
        }]
    }
}