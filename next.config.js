/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['imap', 'mailparser', 'nodemailer']
  }
}

module.exports = nextConfig
