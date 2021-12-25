import { useRouter } from "next/router"
import Head from "next/head";

const AppRoot = ({ Component, pageProps }) => {
  const router = useRouter();

  return <>
    <Head>
      <title>Puzzle Cards</title>

      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta name="keywords" content="Puzzle Cards,Worship the Sun,Chris Patuzzo,puzzle,platform,game,card game" />
      <meta name="description" content="An original card game by Chris Patuzzo." />
      <meta name="author" content="Chris Patuzzo" />

      <meta property="og:title" content="Worship the Sun Puzzle Cards" />
      <meta property="og:url" content={`https://puzzlecards.github.io${router.pathname}`} />
      <meta property="og:type" content="website" />
      <meta property="og:description" content="An original card game by Chris Patuzzo." />
      <meta property="og:image" content="https://puzzlecards.github.io/images/facebook_share.png" />
      <meta property="og:image:secure_url" content="https://puzzlecards.github.io/images/facebook_share.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Worship the Sun Puzzle Cards" />
      <meta name="twitter:site" content="@puzzle_cards" />
      <meta name="twitter:creator" content="@chrispatuzzo" />
      <meta name="twitter:description" content="An original card game by Chris Patuzzo." />
      <meta name="twitter:image" content="https://puzzlecards.github.io/images/twitter_share.png" />
    </Head>

    <Component {...pageProps} />
  </>;
};

export default AppRoot;
