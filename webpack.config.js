const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env, { mode }) => {
  return {
    entry: {
      'index': './src/index.ts',
      'viewer': './src/viewer.ts',
    },
    devtool: (mode == 'production') ? 'source-map' : 'inline-source-map',
    output: {
      filename: '[name].js',
      // path: path.resolve(__dirname, 'build')
      path: __dirname
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.pug$/,
          use: 'pug-loader',
          exclude: /node_modules/
        },
        {
          test: /\.s[ac]ss$/i,
          use: [ 'style-loader','css-loader','sass-loader'],
        },
        {
          test: /\.(png|svg|jpe?g|gif|woff)$/,
          use: 'file-loader'
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },
    plugins: [ //https://github.com/jantimon/html-webpack-plugin/issues/218#issuecomment-183066602
      new HtmlWebpackPlugin({
        inject:true,
        chunks: ['index'],
        template: './view/index.pug',
        filename: 'index.html'
      }),
      new HtmlWebpackPlugin({
        // inject:false,
        chunks: ['viewer'],
        template: './view/viewer.pug',
        filename: 'viewer.html'
      }),
    ],
  }
}
