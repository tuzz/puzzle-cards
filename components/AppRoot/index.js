import { useState, useEffect, createContext } from "react";
import { ethers } from "ethers";
import Head from "next/head";
import PuzzleCard from "../../public/PuzzleCard";
import AppContext from "./context";

const AppRoot = ({ Component, pageProps }) => {
  const [appContext, setAppContext] = useState({ PuzzleCard, decks: {} });
  const [connectPoller, setConnectPoller] = useState();

  useEffect(async () => {
    if (typeof ethereum === "undefined") { return; }

    const provider = new ethers.providers.Web3Provider(ethereum, "any");
    const signer = provider.getSigner();

    PuzzleCard.attach(ethers, provider);
    PuzzleCard.connect(signer);

    const address = await signer.getAddress().catch(() => {});
    if (address) { ensureDeck(address); } else { pollForConnect(); }

    ethereum.on("accountsChanged", ([address]) => address && ensureDeck(address));

    if (!address) {
      const params = new URLSearchParams(window.location.search);
      const connectOnLoad = params.get("connectOnLoad") === "true";

      connectOnLoad && ethereum.request({ method: "eth_requestAccounts" });

      const href = window.location.href.replaceAll(/[?&]connectOnLoad=true/g, "");
      history.replaceState(null, "", href);
    }
  }, []);

  const pollForConnect = () => {
    setConnectPoller(setInterval(() => {
      PuzzleCard.CONTRACT.signer.getAddress().then(ensureDeck).catch(() => {});
    }, 1000));
  };

  const ensureDeck = async (address) => {
    address = address.toLowerCase();

    setAppContext(c => {
      if (c.decks[address]) {
        return { ...c, address };
      } else {
        return { ...c, address, decks: { ...c.decks, [address]: [] } };
      }
    });

    setConnectPoller(poller => { poller && clearInterval(poller); });
  };

  useEffect(() => {
    for (let [address, deck] of Object.entries(appContext.decks)) {
      if (!deck.fetching && !deck.fetched) {
        deck.fetching = true;

        PuzzleCard.fetchDeck(address, updateFetchedDeck(address), console.log).then(deck => {
          deck.fetched = true;

          setAppContext(c => ({ ...c, decks: { ...c.decks, [address]: deck } }));
        });
      }
    }
  }, [appContext.decks]);

  const updateFetchedDeck = (address) => (changes) => {
    setAppContext(c => {
      const deck = c.decks[address].slice(0);
      deck.fetched = true;

      PuzzleCard.updateFetchedDeck(deck, changes);

      return { ...c, decks: { ...c.decks, [address]: deck } };
    });
  };

  return <>
    <Head>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
    <AppContext.Provider value={appContext}>
      <Component {...pageProps} />
    </AppContext.Provider>
  </>;
};

export default AppRoot;
