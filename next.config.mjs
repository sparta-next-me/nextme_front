/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites(){
    return[
      {
        // 브라우저에서 이 주소로 요청을 보내면
        source: '/user-api/:path*',
        // 실제로는 이 서버 주소로 몰래 전달합니다 (CORS 회피)
        destination: 'http://34.50.7.8:32000/:path*',

      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
