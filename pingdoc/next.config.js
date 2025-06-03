/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // We're in the browser build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        encoding: false,
        fs: false,
        path: false,
        pdfjs: false,
        url: false,
        util: false,
        zlib: false,
      };
    }

    // Exclude canvas from being processed by webpack
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];

    return config;
  },
  // Add this to ensure PDF.js worker is copied to the correct location
  async rewrites() {
    return [
      {
        source: '/pdf.worker.min.js',
        destination: '/_next/static/pdf.worker.min.js',
      },
    ];
  },
};

module.exports = nextConfig;
