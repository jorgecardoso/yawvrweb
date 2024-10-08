const path = require('path');

module.exports = {
  devServer: {
    disableHostCheck: true
  },
  entry: './index.js',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    globalObject: 'this',
    path: __dirname + '/dist',
    filename: process.env.NODE_ENV === 'production' ? 'aframe-yawvr-component.min.js' : 'aframe-yawvr-component.js',
    libraryTarget: 'umd'
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')]
  }
};
