import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";

const MyError = ({ statusCode, hasGetInitialPropsRun, err }) => {
  if (!hasGetInitialPropsRun && err) { Sentry.captureException(err); }

  return <NextError statusCode={statusCode} />;
};

MyError.getInitialProps = async ({ res, err, asPath }) => {
  const errorInitialProps = await NextError.getInitialProps({ res, err });
  errorInitialProps.hasGetInitialPropsRun = true;

  if (err) {
    Sentry.captureException(err);
  } else {
    Sentry.captureException(new Error(`_error.js getInitialProps missing data at path: ${asPath}`));
  }

  await Sentry.flush(2000);
  return errorInitialProps;
};

export default MyError;
