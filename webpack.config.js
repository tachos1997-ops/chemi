const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  return {
    entry: ['core-js/stable', './src/main.js'],
    output: {
      filename: 'bundle.[contenthash].js',
      path: path.resolve(__dirname, 'www'),
      clean: true,
    },
    resolve: {
      extensions: ['.js'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: ['defaults'],
                    },
                    useBuiltIns: 'entry',
                    corejs: 3,
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.(png|svg|wav)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name][hash][ext]',
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        templateContent: ({ htmlWebpackPlugin }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elemental Nexus</title>
  ${htmlWebpackPlugin.tags.headTags}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;700&display=swap" rel="stylesheet">
</head>
<body>
  <noscript>You need JavaScript enabled to play Elemental Nexus.</noscript>
</body>
</html>`,
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/assets/icons/manifest.json', to: 'assets/manifest.json' },
        ],
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'www'),
      },
      compress: true,
      port: 8080,
      hot: true,
      host: '0.0.0.0',
    },
    devtool: isProd ? 'source-map' : 'eval-source-map',
    performance: {
      hints: false,
    },
  };
};
