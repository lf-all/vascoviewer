/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantém o Chromium fora do bundle do webpack
  serverExternalPackages: ["@sparticuz/chromium", "playwright-core"],
  // Garante que o binário do Chromium (bin/*.br) vá junto na função serverless
  outputFileTracingIncludes: {
    "/api/vsco": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
  // Imagens do VSCO são servidas direto da CDN deles (sem gastar cota de otimização da Vercel)
  images: { unoptimized: true },
};

module.exports = nextConfig;
