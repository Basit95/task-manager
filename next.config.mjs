/** @type {import('next').NextConfig} */
const nextConfig = {
  // Database drivers must run as plain Node modules, not be bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
