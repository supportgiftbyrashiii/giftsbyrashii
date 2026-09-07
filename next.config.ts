import type { NextConfig } from 'next';

const nextConfig: NextConfig = {images:{remotePatterns:[{protocol:'https',hostname:'images.unsplash.com'},{protocol:'https',hostname:'*.supabase.co'},{protocol:'https',hostname:'giftsbyrashi.com',pathname:'/cdn/shop/**'},{protocol:'https',hostname:'cdn.shopify.com',pathname:'/s/files/**'}]}};

export default nextConfig;
