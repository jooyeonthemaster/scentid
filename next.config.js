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
  // 서버 사이드에서 외부 패키지 번들 제외 (Next 15 기준)
  serverExternalPackages: ['firebase-admin']
};

module.exports = nextConfig; 