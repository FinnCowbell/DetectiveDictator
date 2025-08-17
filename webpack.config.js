const webpack = require("webpack");
const path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FaviconsWebpackPlugin = require('favicons-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

process.traceDeprecation = true;

const isDevelopment = process.env.NODE_ENV !== 'production';

const faviconConfig = {
  icons: {
    windows: false,
    appleStartup: false,
  }
}

module.exports = (env) => {
  let config = {
    mode: isDevelopment ? "development" : "production",
    devtool: 'eval-cheap-source-map',
    entry: {
      main: ["./src/index.tsx"],
    },
    output: {
      path: path.resolve(__dirname, "dist/"),
      filename: "index_bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          use: [
            {
              loader: "babel-loader",
              options: {
                plugins: [
                  isDevelopment && require.resolve('react-refresh/babel')
                ].filter(Boolean),
              }
            },
          ],
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
        // Asset Modules for images
      {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8kb
            }
          },
          generator: {
            filename: 'media/[name]-[hash][ext][query]'
          }
        },
        // Asset Modules for fonts and svg
        {
          test: /\.(woff(2)?|ttf|eot|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name][ext][query]'
          }
        },
      ],
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
        'DD_PORT': 1945
      }),
      ...(isDevelopment ? [new ReactRefreshWebpackPlugin()] : [])
    ],
  devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 8000,
      hot: true,
    },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  };
  return config;
};
