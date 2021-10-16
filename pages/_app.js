import { useState, useEffect } from "react";
import { ethers } from "ethers";
import PuzzleCard from "../public/PuzzleCard";
import AppContext from "../components/AppContext";

const App = ({ Component, pageProps }) => {
  const [appContext, setAppContext] = useState({ PuzzleCard });

  useEffect(async () => {
    if (typeof ethereum === "undefined") { return; }

    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();

    PuzzleCard.attach(ethers, provider);
    PuzzleCard.connect(signer);

    const address = await signer.getAddress().catch(() => {});
    setAppContext(c => ({ ...c, address: address.toLowerCase() }));

    ethereum.on("accountsChanged", ([address]) => {
      setAppContext(c => ({ ...c, address: address.toLowerCase() }));
    });
  }, []);

  return (
    <AppContext.Provider value={appContext}>
      <Component {...pageProps} />
    </AppContext.Provider>
  );
};

export default App;
