import { useContext } from "react";
import AppContext from "../components/AppRoot/context";

const Index = () => {
  const { address, decks, PuzzleCard } = useContext(AppContext);

  const numCards = (decks[address] || []).map(({ quantity }) => quantity).reduce((a, b) => a + b, 0);

  const ensureNetwork = async () => {
    const expectedNetwork = await PuzzleCard.CONTRACT_NETWORK;
    const actualNetwork = await PuzzleCard.CONTRACT.provider.getNetwork();

    if (actualNetwork.chainId === expectedNetwork.chainId) { return true; }

    await ethereum.request({ method: "wallet_addEthereumChain", params: [{
      chainName: expectedNetwork.name,
      chainId: "0x" + expectedNetwork.chainId.toString(16),
      rpcUrls: [expectedNetwork.url],
      nativeCurrency: { symbol: expectedNetwork.symbol, decimals: 18 },
      blockExplorerUrls: [expectedNetwork.explorer],
    }] });
  };

  const discard2Pickup1 = async () => {
    if (!await ensureNetwork()) { return; }

    for (let i = 0; i < 1000; i += 1) {
      const card1 = decks[address][i].card;
      const card2 = decks[address][i + 1].card;

      const [isAllowed, _] = await PuzzleCard.canDiscard2Pickup1([card1, card2]);

      if (isAllowed) {
        await PuzzleCard.discard2Pickup1([card1, card2]);
        break;
      }
    }
  };

  return <>
    {address && <>
      <p>hi {address}</p>
      {!decks[address].fetched && <p>Loading deck...</p>}
      {decks[address].fetched && <p>{numCards} cards in deck</p>}
      {decks[address].fetched && <button onClick={discard2Pickup1}>discard2Pickup1</button>}
      {decks[address].fetched && decks[address].slice(0, 15).map(({ card, quantity, tokenID }) => (
        <span key={tokenID}>
          <span>{quantity}</span>
        </span>
      ))}
    </>}
    {!address && <button onClick={() => ethereum.request({ method: "eth_requestAccounts" })}>connect</button>}
  </>;
};

export default Index;
