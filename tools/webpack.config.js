module.exports = {
    entry: [
        "./dist/spector.css",
        "./dist/prism.css",
        "./dist/prism.js",
        "./dist/spector.js"
    ],
    output: {
        filename: './dist/spector.bundle.js',
        libraryTarget: "var",
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
            test: /spector.js$/,
            use: [ 'exports-loader?SPECTOR' ]
        }]
    }
}