const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin({
    async: false
  }),
  new CopyWebpackPlugin({
    patterns: [
      { from: 'src/assets', to: 'assets' }
    ]
  })
];