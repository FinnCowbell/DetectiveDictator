const webpack = require("webpack");
const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin');
process.traceDeprecation = true;

const faviconConfig={
  icons:{
    windows: false,
    appleStartup: false,
  }
}

module.exports = (env) => {
  let config = {
    devtool: 'eval-cheap-source-map',
    entry: {
      main: ["react-hot-loader/patch", "./src/index.tsx"], 
    },
    output: {
      path: path.resolve(__dirname, "dist/"),
      filename: "index_bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          use: "babel-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.scss$/,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 8192, //8kb max img size.
                mimetype: true,
                fallback: "file-loader",
                outputPath: "media",
                name: "[folder]/[name]-[md4:hash:hex:5].[ext]",
              },
            },
          ],
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: "file-loader",
              options: {
                outputPath: "fonts",
                name: "[name].[ext]",
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      alias: {
        "react-dom": "@hot-loader/react-dom",
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './src/index.html',
      }), 
      new FaviconsWebpackPlugin({
        logo: './src/media/fascist-membership-old.png',
        mode: 'auto',
        cache: true,
        favicons: faviconConfig,
      }),
      new ESLintPlugin(),
      new CompressionPlugin(), 
      new webpack.EnvironmentPlugin({
      'DD_SERVER': 'localhost',
      'PORT': 80,
      'DD_PORT': 1945})],
    devServer: {
      static:{
        directory: path.join(__dirname, "./dist")
      },
      port: 8000,

    },
  };
  return config;
};
