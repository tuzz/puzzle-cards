const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig({
  rewrites: () => [
    { source: "/embed", destination: "/embed/index.html" },
  ],
}, { silent: true });
