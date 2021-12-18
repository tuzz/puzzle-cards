import Head from "next/head";

const AppRoot = ({ Component, pageProps }) => <>
  <Head>
    <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    <title>Puzzle Cards</title>
  </Head>
  <Component {...pageProps} />
</>;

export default AppRoot;
