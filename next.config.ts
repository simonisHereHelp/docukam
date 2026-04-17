import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_IMG_2_6W_URL: process.env.IMG_2_6W_URL,
  },
};

export default nextConfig;
