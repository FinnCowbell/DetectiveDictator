const webpack = require("webpack");
const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
var express = require("express");
process.traceDeprecation = true;
module.exports = (env) => {
  let config = {
    // mode: "development",
    entry: {
      main: ["react-hot-loader/patch", "./src/index.js"], 
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
      extensions: [".js", ".jsx"],
      alias: {
        "react-dom": "@hot-loader/react-dom",
      },
    },
    plugins: [new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
    }), 
      new CompressionPlugin(), new webpack.EnvironmentPlugin({
      'DD_SERVER': 'localhost',
      'DD_PORT': process.env.PORT || 1945})],
    devServer: {
      static:{
        directory: path.join(__dirname, "./dist")
      },
      port: 8000,

    },
  };
  return config;
};
