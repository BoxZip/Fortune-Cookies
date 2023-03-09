const path = require('path');
module.exports = {
    entry: path.join(__dirname, 'www/web-app.js'),
    mode: "none",
    output: {
        path: path.resolve(__dirname, 'www'),
        filename: 'web-app.webpack.js'
    },
    resolve: {
        alias: {
            'node_modules': path.join(__dirname, 'node_modules'),
        }
    }
};