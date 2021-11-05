import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7b644de29b724709a2c083c9e975c870@o880976.ingest.sentry.io/6051594",
  tracesSampleRate: 1.0,
});
