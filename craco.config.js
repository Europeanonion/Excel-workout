// craco.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add explicit chunking configuration
      if (webpackConfig.optimization) {
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 0,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          automaticNameDelimiter: '~',
          enforceSizeThreshold: 50000,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            // Explicitly separate exceljs into its own chunk
            exceljs: {
              test: /[\\/]node_modules[\\/]exceljs[\\/]/,
              name: 'excel-vendor',
              chunks: 'async',  // This is key - only include in async chunks
              priority: 20,     // Higher priority than default vendor chunks
            },
            // Explicitly separate papaparse into its own chunk
            papaparse: {
              test: /[\\/]node_modules[\\/]papaparse[\\/]/,
              name: 'csv-vendor',
              chunks: 'async',
              priority: 20,
            },
          },
        };
      }

      // Add analyzer plugin if needed
      if (process.env.ANALYZE) {
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: 'bundle-report.html',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: 'bundle-stats.json',
          })
        );
      }
      
      return webpackConfig;
    }
  }
};