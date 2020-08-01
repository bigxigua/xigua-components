const path = require('path');

module.exports = function webpackConfig(compile) {
  compile.resolve.alias = {
    ...compile.resolve.alias,
    ...({
      '@common': path.resolve(__dirname, './components'),
      '@util': path.resolve(__dirname, './util'),
      '@hooks': path.resolve(__dirname, './hooks'),
    })
  }
  return compile;
}