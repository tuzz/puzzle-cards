import { useState, useEffect, createContext } from "react";
import { ethers } from "ethers";
import Head from "next/head";
import PuzzleCard from "../../public/PuzzleCard";
import AppContext from "./context";

const AppRoot = ({ Component, pageProps }) => {
  const [appContext, setAppContext] = useState({ PuzzleCard, decks: {}, maxTier: "Mortal", generation: 0 });
  const [connectPoller, setConnectPoller] = useState();

  useEffect(async () => {
    if (typeof ethereum === "undefined") { return; }

    const provider = new ethers.providers.Web3Provider(ethereum, "any");
    const signer = provider.getSigner();
    const network = await provider.getNetwork();

    PuzzleCard.attach(ethers, provider);
    PuzzleCard.connect(signer);

    const address = await signer.getAddress().catch(() => {});
    if (address) { ensureDeck(address, network.chainId); } else { pollForConnect(); }

    ethereum.on("accountsChanged", ([address]) => address && ensureDeck(address));
    ethereum.on("chainChanged", hex => setAppContext(c => ({ ...c, chainId: Number(hex) })));

    if (!address) {
      const params = new URLSearchParams(window.location.search);
      const connectOnLoad = params.get("connectOnLoad") === "true";

      connectOnLoad && ethereum.request({ method: "eth_requestAccounts" });

      const href = window.location.href.replaceAll(/[?&]connectOnLoad=true/g, "");
      history.replaceState(null, "", href);
    }

    // Make it so you can use PuzzleCard in the JavaScript console for convenience.
    window.PuzzleCard = PuzzleCard;
  }, []);

  const pollForConnect = () => {
    setConnectPoller(setInterval(() => {
      PuzzleCard.CONTRACT.signer.getAddress().then(address => {
        PuzzleCard.CONTRACT.provider.getNetwork().then(network => {
          ensureDeck(address, network.chainId);
        });
      }).catch(() => {});
    }, 1000));
  };

  const ensureDeck = async (address, chainId) => {
    address = address.toLowerCase();

    const maxTier = await PuzzleCard.maxTierUnlocked(address).catch(() => "Mortal");

    setAppContext(c => {
      const newContext = { ...c, address, maxTier, generation: c.generation + 1 };

      if (chainId) {
        newContext.chainId = chainId;
      }

      if (!c.decks[address]) {
        newContext.decks = { ...c.decks, [address]: [] };
      }

      return newContext;
    });

    setConnectPoller(poller => { poller && clearInterval(poller); });
  };

  useEffect(() => {
    for (let [address, deck] of Object.entries(appContext.decks)) {
      if (!deck.fetching && !deck.fetched) {
        deck.fetching = true;
        deck.justChanged = [];

        PuzzleCard.fetchDeck(address, updateFetchedDeck(address), console.log).then(deck => {
          deck.fetched = true;
          deck.justChanged = [];

          setAppContext(c => ({ ...c, decks: { ...c.decks, [address]: deck } }));
        });
      }
    }
  }, [appContext.decks]);

  const updateFetchedDeck = (address) => (changes) => {
    setAppContext(c => {
      const deck = c.decks[address].slice(0);

      deck.fetched = true;
      deck.justChanged = PuzzleCard.updateFetchedDeck(deck, changes);

      const maxIndex = PuzzleCard.TIER_NAMES.findIndex(n => n === c.maxTier);
      let maxTierIncreased = false;

      for (let { card, delta } of changes) {
        if (delta > 0 && card.tierIndex() > maxIndex) {
          maxTierIncreased = true;
        }
      }

      if (maxTierIncreased) {
        setTimeout(updateMaxTier, 0);
      }

      return { ...c, decks: { ...c.decks, [address]: deck } };
    });
  };

  // Double check the max tier has actually increased by calling the contract
  // method in case the user was gifted cards which doesn't count as promoting.
  const updateMaxTier = async () => {
    const maxTier = await PuzzleCard.maxTierUnlocked(appContext.address).catch(() => "Mortal");

    if (maxTier !== appContext.maxTier) {
      setAppContext(c => ({ ...c, maxTier }));
    }
  }

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
