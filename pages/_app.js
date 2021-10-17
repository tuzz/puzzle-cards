import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PuzzleCard from "../public/PuzzleCard";
import AppContext from "../components/AppContext";

const App = ({ Component, pageProps }) => {
  const [appContext, setAppContext] = useState({ PuzzleCard, decks: {} });

  useEffect(async () => {
    if (typeof ethereum === "undefined") { return; }

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    PuzzleCard.attach(ethers, provider);
    PuzzleCard.connect(signer);

    const address = await signer.getAddress().catch(() => {});
    if (address) { ensureDeck(address); }

    ethereum.on("accountsChanged", ([address]) => ensureDeck(address));
  }, []);

  const ensureDeck = async (address) => {
    address = address.toLowerCase();

    setAppContext(c => {
      if (c.decks[address]) {
        return { ...c, address };
      } else {
        return { ...c, address, decks: { ...c.decks, [address]: [] } };
      }
    });
  };

  useEffect(() => {
    for (let [address, deck] of Object.entries(appContext.decks)) {
      if (!deck.fetching && !deck.fetched) {
        deck.fetching = true;

        PuzzleCard.fetchDeck(address, console.log, console.log).then(deck => {
          deck.fetched = true;

          setAppContext(c => ({ ...c, decks: { ...c.decks, [address]: deck } }));
        });
      }
    }
  }, [appContext.decks]);

  return (
    <AppContext.Provider value={appContext}>
      <Component {...pageProps} />
    </AppContext.Provider>
  );
};

export default App;
