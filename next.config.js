/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['ddragon.leagueoflegends.com', 'opgg-static.akamaized.net'],
  },
}

module.exports = nextConfig
