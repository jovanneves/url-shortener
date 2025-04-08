/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  
  // Otimização de imagens
  images: {
    domains: ['localhost', 'urlshortener', 'go'], // Domínios permitidos para imagens
    formats: ['image/webp'], // Formatos adicionais
  },
  
  // Compressão de respostas para melhor performance
  compress: true,
  
  // Métricas para monitoramento
  experimental: {
    // Habilitar geração de relatório de métricas de bundle
    webVitalsAttribution: ['CLS', 'LCP', 'FID', 'INP'],
    
    // Melhorias na otimização do compilador React
    optimizeCss: true,
  },
  
  // Headers HTTP para melhorar performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig); 