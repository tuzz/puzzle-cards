import { useContext } from "react";
import AppContext from "../components/AppContext";

const Index = () => {
  const { address, decks } = useContext(AppContext);

  const numCards = (decks[address] || []).map(({ quantity }) => quantity).reduce((a, b) => a + b, 0);

  return <>
    {address && <>
      <p>hi {address}</p>
      {!decks[address].fetched && <p>Loading deck...</p>}
      {decks[address].fetched && <p>{numCards} cards in deck</p>}
    </>}
    {!address && <button onClick={() => ethereum.request({ method: "eth_requestAccounts" })}>connect</button>}
  </>;
};

export default Index;
