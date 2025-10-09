const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Ensure the bundle script is added to index.html
const frontendIndexPath = path.join(__dirname, 'Frontend', 'index.html');
if (fs.existsSync(frontendIndexPath)) {
    let htmlContent = fs.readFileSync(frontendIndexPath, 'utf8');
    if (!htmlContent.includes('main.bundle.js')) {
        const bodyCloseTag = htmlContent.lastIndexOf('</body>');
        if (bodyCloseTag !== -1) {
            htmlContent = htmlContent.substring(0, bodyCloseTag) + 
                '\n    <script src="/main.bundle.js"></script>\n  ' + 
                htmlContent.substring(bodyCloseTag);
            fs.writeFileSync(frontendIndexPath, htmlContent, 'utf8');
        }
    }
}

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        mode: argv.mode || 'development',
        entry: {
            main: './Frontend/app.js',
        },
        output: {
            filename: 'main.bundle.js',
            path: isProduction ? path.resolve(__dirname, 'dist') : path.resolve(__dirname, 'Frontend'),
            publicPath: '/',
            clean: isProduction,
        },
    devServer: {
        static: {
            directory: path.join(__dirname, 'Frontend'),
        },
        compress: true,
        port: 3000,
        hot: true,
        open: true,
        historyApiFallback: {
            index: '/index.html',
            disableDotRule: true,
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext]',
                },
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name][ext]',
                },
            },
        ]
    },
    plugins: isProduction ? [
        new HtmlWebpackPlugin({
            template: './Frontend/index.html',
            filename: 'index.html',
            inject: true,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'Frontend/*.html',
                    to: '[name][ext]',
                    globOptions: {
                        ignore: ['**/index.html'], // Skip index.html as it's handled by HtmlWebpackPlugin
                    },
                },
                {
                    from: 'Frontend/*.js',
                    to: '[name][ext]',
                    globOptions: {
                        ignore: ['**/app.js', '**/main.bundle.js'], // Skip app.js as it's the entry point
                    },
                },
                {
                    from: 'Frontend/favicon.svg',
                    to: 'favicon.svg',
                },
            ],
        })
    ] : []
    };
};
