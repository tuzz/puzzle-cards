import { useContext } from "react";
import AppContext from "../components/AppContext";

const Index = () => {
  const { address, decks, PuzzleCard } = useContext(AppContext);

  const numCards = (decks[address] || []).map(({ quantity }) => quantity).reduce((a, b) => a + b, 0);

  const discard2Pickup1 = async () => {
    for (let i = 0; i < 1000; i += 1) {
      const card1 = decks[address][i].card;
      const card2 = decks[address][i + 1].card;

      const [isAllowed, _] = await PuzzleCard.canDiscard2Pickup1([card1, card2]);

      if (isAllowed) {
        await PuzzleCard.discard2Pickup1([card1, card2]).then(console.log);
        break;
      }
    }
  };

  return <>
    {address && <>
      <p>hi {address}</p>
      {!decks[address].fetched && <p>Loading deck...</p>}
      {decks[address].fetched && <p>{numCards} cards in deck</p>}
      <button onClick={discard2Pickup1}>discard2Pickup1</button>
    </>}
    {!address && <button onClick={() => ethereum.request({ method: "eth_requestAccounts" })}>connect</button>}
  </>;
};

export default Index;
