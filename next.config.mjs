/** @type {import('next').NextConfig} */
// VigiSwap ships as a static export deployed to Cloudflare Pages. The only server
// surface is a Cloudflare Pages Function at functions/api/vestige/[[path]].ts (the
// VestigeIndex proxy). Security headers live in public/_headers (static export does
// not run next.config headers()).
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
