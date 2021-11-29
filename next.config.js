const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig({
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        ],
      },
    ]
  },
}, { silent: true });
