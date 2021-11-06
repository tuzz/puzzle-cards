import { useContext, useState, useEffect } from "react";
import AppContext from "../AppRoot/context";
import Metamask from "./metamask";
import TransactState from "./transactState";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import FilterRows from "../FilterRows";
import DragRegion from "../DragRegion";
import CardsInPlay from "../CardsInPlay";
import MintChip from "../MintChip";
import CardOutline from "../CardOutline";
import WoodSliders from "../WoodSliders";
import Pagination from "../Pagination";
import styles from "./styles.module.scss";
import Filters from "./filters";

const CardTable = () => {
  const { PuzzleCard, decks, address, chainId, generation } = useContext(AppContext);
  const [chosenStacks, setChosenStacks] = useState([]);
  const [hourglassStacks, setHourglassStacks] = useState([]);
  const [mintChipActive, setMintChipActive] = useState(true);
  const [buttonAction, setButtonAction] = useState();
  const [transactState, setTransactState] = useState(TransactState.INITIAL);
  const [filters, setFilters] = useState(new Filters());

  const channel = {};

  const handleStackMoved = ({ cardStack, movedTo }) => {
    updateStacksBasedOnPosition(cardStack, movedTo, chosenStacks, setChosenStacks, channel.overlapsOutline);
    updateStacksBasedOnPosition(cardStack, movedTo, hourglassStacks, setHourglassStacks, channel.overlapsYOfTheBottomOfOutline, updateExclusions);
  };

  const handleChipMoved = ({ movedTo }) => {
    setMintChipActive(channel.circleOverlapsOutline(movedTo));
  };

  const updateStacksBasedOnPosition = (cardStack, position, stacks, setStacks, shouldIncludeFn, callbackFn) => {
    const shouldInclude = shouldIncludeFn(position);
    const isIncluded = stacks.findIndex(s => s.tokenID === cardStack.tokenID) !== -1;

    setStacks(stacks => {
      if (shouldInclude && !isIncluded) {
        return [...stacks, cardStack];
      } else if (!shouldInclude && isIncluded) {
        return stacks.filter(c => c.tokenID !== cardStack.tokenID);
      } else {
        return stacks;
      }
    });

    callbackFn && callbackFn(cardStack, shouldInclude);
  };

  const updateExclusions = (cardStack, isInHourglassArea) => {
    setFilters(f => isInHourglassArea ? f.exclude(cardStack) : f.include(cardStack));
  };

  const setButtonActionBasedOnPositions = async (causedByNetworkChange) => {
    const [cards, _maxQuantity] = chosenCardsWithMaxQuantity();

    const actionNames = await Metamask.actionsThatCanBeTaken(PuzzleCard, cards, mintChipActive, address, () => {
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

  // If only one stack of cards is over the card outline, we may still be able
  // to perform actions if there are multiple cards in the stack.
  const chosenCardsWithMaxQuantity = () => {
    if (chosenStacks.length === 0) { return [[], 0]; }

    let chosenCards = chosenStacks.map(s => s.card);
    let maxQuantity = Math.min(...chosenStacks.map(s => s.quantity));

    if (chosenStacks.length === 1 && chosenStacks[0].quantity >= 2) {
      chosenCards = [chosenCards[0], chosenCards[0]];
      maxQuantity = Math.floor(maxQuantity / 2);
    }

    return [chosenCards, maxQuantity];
  };

  useEffect(setButtonActionBasedOnPositions, [chosenStacks, mintChipActive, generation]);
  useEffect(() => setButtonActionBasedOnPositions(true), [chainId]);

  const performAction = async () => {
    const [cards, maxQuantity] = chosenCardsWithMaxQuantity();

    const requests = await Metamask.performAction(PuzzleCard, buttonAction, cards, maxQuantity, channel.mintArgs());
    if (requests.length === 0) { return; } // No transaction requests initiated, e.g. Metamask locked.

    setTransactState(TransactState.REQUESTING);

    const results = await Promise.all(requests.map(async (request) => {
      const transactions = await request.catch(() => {});
      const transaction = Array.isArray(transactions) ? transactions[0] : transactions;

      if (!transaction) { return { state: "cancelled" }; } // The user rejected the request in Metamask.

      setTransactState(TransactState.PROCESSING);

      try {
        await transaction.wait();
        return { state: "succeeded" };
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

  const alignCardsWithSliders = () => {
    channel.alignStacks(hourglassStacks);
  }

  const clearHourglassStacks = () => {
    channel.clearStacks(hourglassStacks);
  };

  const buttonFlashing = transactState.requesting() || transactState.processing();
  const buttonEnabled = buttonAction && !buttonFlashing;

  const isPuzzleCardAction = buttonAction && !buttonAction.match(/connectToMetamask/);

  const stickSpinning = isPuzzleCardAction || !transactState.initial();
  const stickRaised = transactState.processing();

  return (
    <div className={styles.card_table}>
      <WorshipStick rockHeight={0.8} spinning={stickSpinning} buttonEnabled={buttonEnabled} buttonFlashing={buttonFlashing} onButtonClick={performAction} raised={stickRaised} className={styles.worship_stick} channel={channel} />
      <YellowSun stickRaised={stickRaised} channel={channel} />

      <TableEdge ratioOfScreenThatIsTableOnPageLoad={0.15}>
        <FilterRows filters={filters} setFilters={setFilters} />

        <DragRegion>
          <CardsInPlay onStackMoved={handleStackMoved} transactState={transactState} chosenStacks={chosenStacks} filters={filters} setFilters={setFilters} channel={channel} />
          <MintChip onMoved={handleChipMoved} filters={filters} channel={channel} />
        </DragRegion>

        <div className={styles.felt_cloth}>
          <CardOutline channel={channel} />
          <WoodSliders transactState={transactState} onButtonClick={alignCardsWithSliders} onSlidersClosed={clearHourglassStacks} />
          <Pagination filters={filters} setFilters={setFilters} />
        </div>
      </TableEdge>
    </div>
  );
};

export default CardTable;
