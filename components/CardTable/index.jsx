import { useContext, useState, useEffect } from "react";
import AppContext from "../AppRoot/context";
import Metamask from "./metamask";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import DragRegion from "../DragRegion";
import CardsInPlay from "../CardsInPlay";
import CardOutline from "../CardOutline";
import styles from "./styles.module.scss";

const CardTable = () => {
  const { PuzzleCard, decks, address, chainId, generation } = useContext(AppContext);
  const [chosenStacks, setChosenStacks] = useState([]);
  const [buttonAction, setButtonAction] = useState();
  const [transacting, setTransacting] = useState(false);
  const [stickGrounded, setStickGrounded] = useState(true);

  const channel = {};

  const handleStackMoved = ({ cardStack, movedTo }) => {
    const expectedChosen = channel.overlapsOutline(movedTo);
    const actualChosen = chosenStacks.findIndex(s => s.tokenID === cardStack.tokenID) !== -1;

    if (expectedChosen && !actualChosen) {
      setChosenStacks(array => [...array, cardStack]);
    } else if (!expectedChosen && actualChosen) {
      setChosenStacks(array => array.filter(c => c !== cardStack));
    }
  };

  const setButtonActionBasedOnChosenStacks = async (causedByNetworkChange) => {
    const cards = chosenStacks.map(cardStack => cardStack.card);

    const actionNames = await Metamask.actionsThatCanBeTaken(PuzzleCard, cards, address, () => {
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

  useEffect(setButtonActionBasedOnChosenStacks, [chosenStacks, generation]);
  useEffect(() => setButtonActionBasedOnChosenStacks(true), [chainId]);

  // TODO: lay out and re-lay out the cards when the address changes (clear chosenCards).
  // TODO: display the minted card?

  const performAction = async () => {
    const cards = chosenStacks.map(cardStack => cardStack.card);

    const promise = Metamask.performAction(PuzzleCard, buttonAction, cards);
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
          <CardsInPlay onStackMoved={handleStackMoved} />
        </DragRegion>

        <div className={styles.felt_cloth}>
          <CardOutline channel={channel} />
        </div>
      </TableEdge>
    </div>
  );
};

export default CardTable;
