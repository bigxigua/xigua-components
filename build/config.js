const path = require('path');
const fs = require('fs');
const NODE_ENV = process.env.NODE_ENV;
const isEnvProduction = NODE_ENV === 'production';
const isEnvDevelopment = NODE_ENV === 'development';
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, './src/' + relativePath);
const publicPath = '/';
module.exports = {
  shouldUseSourceMap: true,
  isEnvProduction,
  isEnvDevelopment,
  devtool: isEnvProduction ? 'source-map' : 'cheap-module-source-map',
  publicPath,
  publicUrl: isEnvProduction ? publicPath.slice(0, -1) : '',
  appIndexJs: resolveApp('index.js'), // 入口文件路径
  appBuildPath: path.resolve(appDirectory, './dist'), // 打包文件路径
  appNodeModules: resolveApp('node_modules'),
  appSrc: resolveApp(''),
  stringified: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
};