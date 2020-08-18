const webpack = require('webpack');
const path = require('path');
// 压缩代码，用于替换uglifyjs-webpack-plugin
const TerserPlugin = require('terser-webpack-plugin');
// 它将在Webpack构建期间搜索CSS资产，并将优化、最小化CSS（默认情况下，它使用cssnano，但可以指定自定义CSS处理器）。解决了extract-text-webpack-plugin CSS重复问题
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// PostCSS的容错CSS解析器，可以找到并修复语法错误，能够解析任何输入
const safePostCssParser = require('postcss-safe-parser');
// 此插件将CSS提取到单独的文件中。它为每个包含CSS的JS文件创建一个CSS文件。它支持CSS和SourceMaps的按需加载
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
// 检测当前环境是否运行在 Windows Subsystem for Linux上
const isWsl = require('is-wsl');
// css Loader
const getStyleLoaders = require('./getStyleLoaders');
const getCSSModuleLocalIdent = require('./getCSSModuleLocalIdent');
const getCacheIdentifier = require('./getCacheIdentifier');
// 可视化分析
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const {
  shouldUseSourceMap,
  isEnvProduction,
  devtool,
  appIndexJs,
  appBuildPath,
  appNodeModules,
  appSrc,
  stringified,
} = require('./config');
const webpackConfig = {
  devtool,
  entry: [appIndexJs],
  output: {
    filename: 'js/index.js',
    path: appBuildPath,
    library: 'xiguaComponents',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom'
    }
  },
  optimization: {
    minimize: true, // 开启优化
    minimizer: [
      // 压缩js
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true
          }
        },
        parallel: !isWsl, // 在 Windows Subsystem for Linux时禁用多进程并行运行，默认并发运行数：os.cpus().length - 1
        cache: true,
        sourceMap: shouldUseSourceMap
      }),
      // 压缩css
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: shouldUseSourceMap
            ? {
              // `inline: false` forces the sourcemap to be output into a
              // separate file
              inline: false,
              // `annotation: true` appends the sourceMappingURL to the end of
              // the css file, helping the browser find the sourcemap
              annotation: true
            }
            : false
        }
      })
    ],
    // Keep the runtime chunk separated to enable long term caching
    // runtimeChunk: true
  },
  resolve: {
    // 添加别名
    alias: {
      '@common': path.resolve(__dirname, '../src/'),
      '@util': path.resolve(__dirname, '../src/_util'),
      '@hooks': path.resolve(__dirname, '../src/_hooks'),
    },
    // 告诉webpack在解析模块时应该搜索哪些目录。
    modules: ['node_modules', appNodeModules],
    plugins: [
      PnpWebpackPlugin
    ]
  },
  resolveLoader: {
    plugins: [
      PnpWebpackPlugin.moduleLoader(module)
    ]
  },
  module: {
    // 使丢失的导出错误而不是警告
    strictExportPresence: true,
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      { parser: { requireEnsure: false } },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]'
            }
          },
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: appSrc,
            loader: require.resolve('babel-loader'),
            options: {
              customize: require.resolve(
                'babel-preset-react-app/webpack-overrides'
              ),
              // @remove-on-eject-begin
              babelrc: false,
              configFile: false,
              presets: [require.resolve('babel-preset-react-app')],
              cacheIdentifier: getCacheIdentifier(
                isEnvProduction
                  ? 'production'
                  : 'development',
                [
                  'babel-plugin-named-asset-import',
                  'babel-preset-react-app'
                ]
              ),
              // @remove-on-eject-end
              plugins: [
                [
                  require.resolve('babel-plugin-named-asset-import'),
                  {
                    loaderMap: {
                      svg: {
                        ReactComponent: '@svgr/webpack?-svgo,+ref![path]'
                      }
                    }
                  }
                ]
              ],
              cacheDirectory: true,
              cacheCompression: isEnvProduction,
              compact: isEnvProduction
            }
          },
          {
            test: /\.(js|mjs)$/,
            exclude: /@babel(?:\/|\\{1,2})runtime/,
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: false,
              configFile: false,
              compact: false,
              presets: [
                [
                  require.resolve('babel-preset-react-app/dependencies'),
                  { helpers: true }
                ]
              ],
              cacheDirectory: true,
              cacheCompression: isEnvProduction,
              // @remove-on-eject-begin
              cacheIdentifier: getCacheIdentifier(
                isEnvProduction
                  ? 'production'
                  : 'development',
                [
                  'babel-plugin-named-asset-import',
                  'babel-preset-react-app'
                ]
              ),
              sourceMaps: false
            }
          },
          {
            test: /\.css$/,
            exclude: /\.module\.css$/,
            use: getStyleLoaders({
              importLoaders: 1,
              sourceMap: isEnvProduction && shouldUseSourceMap
            }),
            sideEffects: true
          },
          {
            test: /\.module\.css$/,
            use: getStyleLoaders({
              importLoaders: 1,
              sourceMap: isEnvProduction && shouldUseSourceMap,
              modules: true,
              getLocalIdent: getCSSModuleLocalIdent
            })
          },
          {
            test: /\.(scss|sass)$/,
            exclude: /\.module\.(scss|sass)$/,
            use: getStyleLoaders(
              {
                importLoaders: 2,
                sourceMap: isEnvProduction && shouldUseSourceMap
              },
              'sass-loader'
            ),
            sideEffects: true
          },
          {
            test: /\.module\.(scss|sass)$/,
            use: getStyleLoaders(
              {
                importLoaders: 2,
                sourceMap: isEnvProduction && shouldUseSourceMap,
                modules: true,
                getLocalIdent: getCSSModuleLocalIdent
              },
              'sass-loader'
            )
          },
          {
            loader: require.resolve('file-loader'),
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    // 显示文件大小
    // new BundleAnalyzerPlugin(),
    new webpack.DefinePlugin(stringified),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: 'css/index.css',
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ].filter(Boolean)
};
module.exports = webpackConfig;