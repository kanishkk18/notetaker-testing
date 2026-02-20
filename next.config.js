/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverComponentsExternalPackages: ['@meeting-baas/sdk'],
    },
    images: {
      domains: ['storage.example.com'], // Add your video storage domain
    },
  }
  
  module.exports = nextConfig