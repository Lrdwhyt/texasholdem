const path = require("path");

module.exports = [
    {
        entry: './src/script.ts',
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.ts']
        },
        output: {
            filename: 'solo.js',
            path: path.resolve(__dirname, 'js')
        }
    },
    {
        entry: "./src/script.ts",
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: "ts-loader",
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.ts']
        },
        output: {
            filename: 'online.js',
            path: path.resolve(__dirname, 'js')
        }
    }];