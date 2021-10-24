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
  const [stickRaised, setStickRaised] = useState(false);
  const [stickGrounded, setStickGrounded] = useState(true);

  const channel = {};

  const handleStackMoved = ({ cardStack, movedTo }) => {
    setChosenStacks(array => {
      const expectedChosen = channel.overlapsOutline(movedTo);
      const actualChosen = chosenStacks.findIndex(s => s.tokenID === cardStack.tokenID) !== -1;

      if (expectedChosen && !actualChosen) {
        return [...array, cardStack];
      } else if (!expectedChosen && actualChosen) {
        return array.filter(c => c.tokenID !== cardStack.tokenID);
      } else {
        return array;
      }
    });
  };

  const setButtonActionBasedOnChosenStacks = async (causedByNetworkChange) => {
    const oneOfEachCard = chosenStacks.map(s => s.card);

    const actionNames = await Metamask.actionsThatCanBeTaken(PuzzleCard, oneOfEachCard, address, () => {
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

  const performActionOnStacks = async () => {
    const oneOfEachCard = chosenStacks.map(s => s.card);

    const requests = await Metamask.performActionOnStacks(PuzzleCard, buttonAction, chosenStacks);
    if (requests.length === 0) { return; } // No transaction requests initiated, e.g. Metamask locked.

    setStickRaised(true); // Prevent the user creating more requests until these are resolved.
    setStickGrounded(false);

    const results = requests.map(async (request) => {
      const transaction = await request.catch(() => {});
      if (!transaction) { return; } // The user rejected the transaction request in Metamask.

      try {
        const mintedCard = await PuzzleCard.fromTransferEvent(transaction);
        // TODO: update CardsInPlay directly rather than relying on RPC events
      } catch (error) {
        return error;
      }
    });

    const errors = (await Promise.all(results)).filter(e => e);

    if (errors.length > 0) {
      alert([
        `${errors.length} out of ${results.length} requests failed.`,
        `You may want to check MetaMask to see if the transactions went through. Otherwise, try again in a few seconds.`,
      ].join("\n"));
    }

    setStickRaised(false);
    channel.waitForStickToFinishMoving().then(() => setStickGrounded(true));
  };

  const buttonEnabled = buttonAction && !stickRaised;
  const stickSpinning = buttonAction && !buttonAction.match(/connectToMetamask/) || !stickGrounded;

  return (
    <div className={styles.card_table}>
      <WorshipStick rockHeight={0.8} spinning={stickSpinning} buttonEnabled={buttonEnabled} onButtonClick={performActionOnStacks} raised={stickRaised} className={styles.worship_stick} channel={channel} />
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
