/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  eslint: {
    // ESLint 검사를 빌드 시 무시
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript 검사를 빌드 시 무시
    ignoreBuildErrors: true,
  },
  // Vercel 서버리스 함수 타임아웃 설정
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin']
  }
};

module.exports = nextConfig; 