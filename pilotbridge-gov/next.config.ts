import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/pilots", destination: "/pilot" },
      { source: "/evaluation", destination: "/evaluator" },
      { source: "/challenges", destination: "/challenge" },
      { source: "/passports", destination: "/passport" },
      { source: "/replications", destination: "/replication" },
    ];
  },
};

export default nextConfig;
