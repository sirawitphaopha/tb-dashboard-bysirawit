/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/TB-CARE LINK.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/TB-CARE%20LINK.html',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
