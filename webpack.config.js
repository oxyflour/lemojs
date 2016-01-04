module.exports = {
    entry: './src/app.tsx',
    output: {
        filename: 'build/bundle.js',
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['', '.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            { test: /\.ts(x?)$/, loader: 'ts-loader' }
        ]
    },
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "jquery": "$",
        "svg-pathdata": "SVGPathData"
    }
}
