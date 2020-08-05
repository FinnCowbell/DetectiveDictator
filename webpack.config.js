const webpack = require("webpack");
const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");
var express = require("express");

module.exports = (env) => {
  let config = {
    entry: ["react-hot-loader/patch", "./src/index.js"],
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
    plugins: [new CompressionPlugin()],
    devServer: {
      contentBase: "./dist",
      port: 8080,
    },
  };
  //If we're building custom (split front and backend), pass the DD_SERVER and DD_PORT environment variables.
  if (env && env.custom) {
    config.plugins.push(
      new webpack.EnvironmentPlugin(
        // Listed values specify the defaults.
        { DD_SERVER: "localhost", DD_PORT: 1945 }
      )
    );
  }
  return config;
};
