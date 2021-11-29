import { useState, useEffect, createContext } from "react";
import { ethers } from "ethers";
import PuzzleCard from "../../public/PuzzleCard";
import DeckContext from "./context";

const DeckLoader = ({ children }) => {
  const [deckContext, setDeckContext] = useState({ PuzzleCard, decks: {}, maxTiers: {}, generation: 0 });
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
    ethereum.on("chainChanged", hex => ensureDeck(null, Number(hex)));

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
    setDeckContext(c => {
      address = address || c.address;
      chainId = chainId || c.chainId;

      if (!address || !chainId) { return c; }
      address = address.toLowerCase();

      const newContext = { ...c, address, generation: c.generation + 1 };

      if (chainId) {
        newContext.chainId = chainId;
      }

      if (!c.decks[address]) {
        newContext.decks = { ...c.decks, [address]: [] };
      }

      setTimeout(() => updateMaxTier(newContext.address, newContext.chainId), 0);

      return newContext;
    });

    setConnectPoller(poller => { poller && clearInterval(poller); });
  };

  useEffect(() => {
    if (!correctNetwork(deckContext.chainId)) { return; }

    for (let [address, deck] of Object.entries(deckContext.decks)) {
      if (!deck.fetching && !deck.fetched) {
        deck.fetching = true;
        deck.justChanged = [];

        PuzzleCard.fetchDeck(address, updateFetchedDeck(address), console.log).then(deck => {
          deck.fetched = true;
          deck.justChanged = [];

          setDeckContext(c => ({ ...c, decks: { ...c.decks, [address]: deck } }));
        });
      }
    }
  }, [deckContext.decks, deckContext.chainId]);

  const updateFetchedDeck = (address) => (changes) => {
    setDeckContext(c => {
      const deck = c.decks[address].slice(0);

      deck.fetched = true;
      deck.justChanged = PuzzleCard.updateFetchedDeck(deck, changes);

      const maxIndex = PuzzleCard.TIER_NAMES.findIndex(n => n === c.maxTiers[address]);
      let maxTierIncreased = false;

      for (let { card, delta } of changes) {
        if (delta > 0 && card.tierIndex() > maxIndex) {
          maxTierIncreased = true;
        }
      }

      if (maxTierIncreased) {
        setTimeout(() => updateMaxTier(c.address, c.chainId), 0);
      }

      return { ...c, decks: { ...c.decks, [address]: deck } };
    });
  };

  // Double check the max tier has actually increased by calling the contract
  // method in case the user was gifted cards which doesn't count as promoting.
  const updateMaxTier = async (address, chainId) => {
    if (!correctNetwork(chainId)) { return; }

    const maxTier = await PuzzleCard.maxTierUnlocked(address);

    setDeckContext(c => {
      if (c.maxTiers[address] === maxTier) { return c; }

      return { ...c, maxTiers: { ...c.maxTiers, [address]: maxTier } };
    });
  }

  const correctNetwork = (chainId) => chainId === PuzzleCard.CONTRACT_NETWORK.chainId;

  return <>
    <DeckContext.Provider value={{ ...deckContext, updateMaxTier }}>
      {children}
    </DeckContext.Provider>
  </>;
};

export default DeckLoader;
