const webpack = require("webpack");
const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");
var express = require("express");
process.traceDeprecation = true;
module.exports = (env) => {
  let config = {
    mode: "development",
    entry: {
      main: ["react-hot-loader/patch", "./src/index.js"], 
    },
    output: {
      path: path.resolve(__dirname, "dist/"),
      filename: "main.js",
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
                limit: 10240, //10kb max img size.
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
    plugins: [new CompressionPlugin(),
      new webpack.EnvironmentPlugin(
        // The below values are the defaults, if it isn't is declared in the env.
        { DD_SERVER: "localhost", DD_PORT: 1945, PORT: "" }
      )],
    devServer: {
      static:{
        directory: path.join(__dirname, "./dist")
      },
      port: 8000,

    },
  };
  //If we're building custom (split front and backend), pass the DD_SERVER and DD_PORT environment variables.
  return config;
};
