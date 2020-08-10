const path = require('path');

module.exports = function webpackConfig(compile) {
  // console.log(compile);
  compile.plugins.shift();
  compile.resolve.alias = {
    ...compile.resolve.alias,
    ...({
      '@common': path.resolve(__dirname, './components'),
      '@util': path.resolve(__dirname, './components/_util'),
      '@hooks': path.resolve(__dirname, './components/_hooks'),
    })
  }
  return compile;
}