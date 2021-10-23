import { useContext, useState, useEffect } from "react";
import AppContext from "../AppRoot/context";
import Metamask from "./metamask";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import DragRegion from "../DragRegion";
import PlayingCard from "../PlayingCard";
import CardOutline from "../CardOutline";
import styles from "./styles.module.scss";

const CardTable = () => {
  const { PuzzleCard, decks, address, chainId, generation } = useContext(AppContext);
  const [chosenCards, setChosenCards] = useState([]);
  const [buttonAction, setButtonAction] = useState();
  const [transacting, setTransacting] = useState(false);
  const [stickGrounded, setStickGrounded] = useState(true);

  const channel = {};

  const handleCardMoved = ({ card, movedTo }) => {
    const expectedChosen = channel.overlapsOutline(movedTo);
    const actualChosen = chosenCards.indexOf(card) !== -1;

    if (expectedChosen && !actualChosen) {
      setChosenCards(array => [...array, card]);
    } else if (!expectedChosen && actualChosen) {
      setChosenCards(array => array.filter(c => c !== card));
    }
  };

  const setButtonActionBasedOnChosenCards = async (causedByNetworkChange) => {
    const actionNames = await Metamask.actionsThatCanBeTaken(PuzzleCard, chosenCards, address, () => {
      setButtonAction(); // Disable the button while the switch network prompt is shown.

      if (causedByNetworkChange) {
        setTimeout(() => alert("Please switch back to the Polygon network."), 100);
      }
    });

    setButtonAction(
      actionNames.length === 1 ? actionNames[0] :
      actionNames.length > 1 ? actionNames.filter(n => n !== "discard2Pickup1")[0] : null
    );
  }

  useEffect(setButtonActionBasedOnChosenCards, [chosenCards, generation]);
  useEffect(() => setButtonActionBasedOnChosenCards(true), [chainId]);

  // TODO: lay out and re-lay out the cards when the address changes (clear chosenCards).
  // TODO: display the minted card?

  const performAction = async () => {
    const promise = Metamask.performAction(PuzzleCard, buttonAction, chosenCards);
    if (!promise) { return; } // No transaction request initiated, e.g. Metamask locked.

    const transaction = await promise.catch(() => {});
    if (!transaction) { return; } // The user rejected the transaction request in Metamask.

    setTransacting(true);
    setStickGrounded(false);

    try {
      const _mintedCard = await PuzzleCard.fromTransferEvent(transaction);
    } catch (error) {
      alert(error.message && error.message.length > 0 ? `Error: ${error.message}` : [
        "Sorry, something unexpected happened.",
        "You may want to check MetaMask to see if the transaction went through. Otherwise, try again in a few seconds.",
      ].join("\n"))
    }

    setTransacting(false);
    channel.waitForStickToFinishMoving().then(() => setStickGrounded(true));
  };

  const buttonEnabled = buttonAction && !transacting;
  const stickSpinning = buttonAction && !buttonAction.match(/connectToMetamask/) || !stickGrounded;
  const stickRaised = transacting; // Raise the stick while the transaction is processing.

  return (
    <div className={styles.card_table}>
      <WorshipStick rockHeight={0.8} spinning={stickSpinning} buttonEnabled={buttonEnabled} onButtonClick={performAction} raised={stickRaised} className={styles.worship_stick} channel={channel} />
      <YellowSun raised={stickRaised} channel={channel} />

      <TableEdge ratioOfScreenThatIsTableOnPageLoad={0.15}>
        <DragRegion>
          {address && decks[address].length >= 1 && <PlayingCard card={decks[address][0].card} onMoved={handleCardMoved} />}
          {address && decks[address].length >= 2 && <PlayingCard card={decks[address][1].card} onMoved={handleCardMoved} />}
        </DragRegion>

        <div className={styles.felt_cloth}>
          <CardOutline channel={channel} />
        </div>
      </TableEdge>
    </div>
  );
};

export default CardTable;
