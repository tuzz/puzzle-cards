import { useContext } from "react";
import AppContext from "../components/AppContext";

const Index = () => {
  const { address, decks } = useContext(AppContext);
  if (!address) { return null; }

  const numCards = decks[address].map(({ quantity }) => quantity).reduce((a, b) => a + b, 0);

  return <>
    <p>hi {address}</p>
    {!decks[address].fetched && <p>Loading deck...</p>}
    {decks[address].fetched && <p>{numCards} cards in deck</p>}
  </>;
};

export default Index;
