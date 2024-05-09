const ExtensionReloader  = require('webpack-extension-reloader');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const extensionPages = {}

let config = {
  mode: process.env.NODE_ENV,
  context: __dirname + '/src'
};

let ExtensionConfig = Object.assign({}, config, {
    entry: {
      ...extensionPages
    },
    output: {
      path: __dirname + '/extension/dist/',
      filename: '[name].dist.js',
    },
    plugins: [
      new ExtensionReloader({
        port: 9090,
        reloadPage: true,
        entries: {
          extensionPage: Object.keys(extensionPages),
        }
      }),
      new CopyPlugin({
          patterns: [
            {
                from: './icons/*',
                to: __dirname + '/extension/dist/',
            },
            {
                from: './popup/index.html',
                to: __dirname + '/extension/dist/popup.html',
            },
            {
                from: './popup/index.css',
                to: __dirname + '/extension/dist/popup.css',
            },
            {
                from: './options/index.html',
                to: __dirname + '/extension/dist/options.html',
            },
            {
                from: './options/index.css',
                to: __dirname + '/extension/dist/options.css',
            },

            // SKETCHY WORKAROUND
            {
              from: './popup/index.js',
              to: __dirname + '/extension/dist/popup.dist.js',
            },
            {
                from: './options/index.js',
                to: __dirname + '/extension/dist/options.dist.js',
            },
          ]
      }),
    ]
});

module.exports = [
    ExtensionConfig,
];
