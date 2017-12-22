const path = require("path");

module.exports = [
    {
        entry: './src/solo.ts',
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
        entry: "./src/lobby.ts",
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
            filename: 'lobby.js',
            path: path.resolve(__dirname, 'js')
        }
    }];