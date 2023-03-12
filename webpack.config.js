const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: {
        'web-app-webpack': path.join(__dirname, 'www/web-app.js'),
        'NFT/NFT-webpack': path.join(__dirname, 'www/NFT/NFT.js')
    },
    mode: "production",
    output: {
        clean: {
            keep(asset) {
                return asset.includes('assets/') || asset.includes('index') || asset.includes('env.js') || asset.includes('web-app.js')|| asset.includes('NFT.js');
            }
        },
        publicPath: '/',
        path: path.resolve(__dirname, 'www'),
        filename: '[name].js'
    },
    resolve: {
        alias: {
            'node_modules': path.join(__dirname, 'node_modules'),
        }
    }
};