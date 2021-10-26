import { useContext, useState, useEffect } from "react";
import AppContext from "../AppRoot/context";
import Metamask from "./metamask";
import TransactState from "./transactState";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import DragRegion from "../DragRegion";
import CardsInPlay from "../CardsInPlay";
import CardOutline from "../CardOutline";
import styles from "./styles.module.scss";
import Filters from "./filters";

const CardTable = () => {
  const { PuzzleCard, decks, address, chainId, generation } = useContext(AppContext);
  const [chosenStacks, setChosenStacks] = useState([]);
  const [buttonAction, setButtonAction] = useState();
  const [transactState, setTransactState] = useState(TransactState.INITIAL);

  useEffect(() => {
    const filters = new Filters();
    filters.setDeck(decks[address]);

    filters.set("series", "Series 0");
    filters.set("tier", "Immortal");
    filters.set("type", "Telescope");
    filters.set("color1", "Red");
    filters.exclude({ tokenID: 286998304654336n, card: {} });
    //filters.include({ tokenID: 286998304654336n, card: { series: "Series 0", tier: "Immortal", type: "Telescope", color1: "Red" } });

    console.log("filtered:", filters.filteredDeck);
    console.log(filters.filteredDeckWithExclusions.length, filters.filteredDeck.length);

    const newFilters = filters.set("series", "hello");
    console.log(filters === newFilters);
  }, [decks, address]);
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

  const performActionOnStacks = async () => {
    const oneOfEachCard = chosenStacks.map(s => s.card);

    const requests = await Metamask.performActionOnStacks(PuzzleCard, buttonAction, chosenStacks);
    if (requests.length === 0) { return; } // No transaction requests initiated, e.g. Metamask locked.

    setTransactState(TransactState.REQUESTING);

    const results = await Promise.all(requests.map(async (request) => {
      const transaction = await request.catch(() => {});
      if (!transaction) { return { state: "cancelled" }; } // The user rejected the request in Metamask.

      setTransactState(TransactState.PROCESSING);

      try {
        const mintedCard = await PuzzleCard.fromTransferEvent(transaction);
        return { state: "succeeded", mintedCard };
      } catch (error) {
        return { state: "failed", error };
      }
    }));

    const numSucceeded = results.filter(r => r.state === "succeeded").length;
    const numFailed = results.filter(r => r.state === "failed").length;

    if (numFailed > 0) {
      alert([
        `${numFailed} out of ${numSucceeded + numFailed} requests failed.`,
        `You may want to check MetaMask to see if the transactions went through. Otherwise, try again in a few seconds.`,
      ].join("\n"));
    }

    if (results.some(r => r.state === "succeeded")) {
      setTransactState(TransactState.ANY_SUCCEEDED);
    } else if (results.every(r => r.state === "failed")) {
      setTransactState(TransactState.ALL_FAILED);
    } else {
      setTransactState(TransactState.ALL_CANCELLED);
    }

    channel.waitForStickToFinishMoving().then(() => setTransactState(TransactState.INITIAL));
  };

  const buttonFlashing = transactState.requesting() || transactState.processing();
  const buttonEnabled = buttonAction && !buttonFlashing;

  const isPuzzleCardAction = buttonAction && !buttonAction.match(/connectToMetamask/);

  const stickSpinning = isPuzzleCardAction || !transactState.initial();
  const stickRaised = transactState.processing();

  return (
    <div className={styles.card_table}>
      <WorshipStick rockHeight={0.8} spinning={stickSpinning} buttonEnabled={buttonEnabled} buttonFlashing={buttonFlashing} onButtonClick={performActionOnStacks} raised={stickRaised} className={styles.worship_stick} channel={channel} />
      <YellowSun stickRaised={stickRaised} channel={channel} />

      <TableEdge ratioOfScreenThatIsTableOnPageLoad={0.15}>
        <DragRegion>
          <CardsInPlay onStackMoved={handleStackMoved} buttonFlashing={buttonFlashing} transactState={transactState} chosenStacks={chosenStacks} />
        </DragRegion>

        <div className={styles.felt_cloth}>
          <CardOutline channel={channel} />
        </div>
      </TableEdge>
    </div>
  );
};

export default CardTable;
