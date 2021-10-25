import { useContext, useState, useRef, useEffect } from "react";
import AppContext from "../AppRoot/context";
import CardStack from "../CardStack";
import layout from "./layout";
import styles from "./styles.module.scss";

const CardsInPlay = ({ onStackMoved = () => {}, buttonFlashing }) => {
  const { address, decks } = useContext(AppContext);
  const [loadedAddress, setLoadedAddress] = useState(address);
  const [stackPositions, _setStackPositions] = useState(withBatchTokenIDs([]));
  const setStackPositions = (array) => _setStackPositions(withBatchTokenIDs(array));

  useEffect(() => {
    if (!address) { return; }

    const cardStacks = decks[address];
    if (!cardStacks.fetched) { setLoadedAddress(); setStackPositions([]); return; }

    if (address === loadedAddress) { updateStackPositions(cardStacks); return; }

    setStackPositions([]);
    setLoadedAddress(address);

    const numColumns = layout.numColumnsBasedOnPageWidth();
    const positions = layout.evenPositions(numColumns, cardStacks.length);

    setStackPositions(positions.map((position, i) => (
      { cardStack: cardStacks[i], position, dealDelay: i * 150, fadeIn: true }
    )));

    // TODO: when paginating, deal cards backwards if going back a page
  }, [address, decks]);

  // Keep track of which tokenIDs have been minted since the button started flashing.
  // This is so we can position the new card stacks in a rotated fan on top of each other.
  useEffect(() => {
    if (buttonFlashing) {
      setStackPositions(array => { array.batchTokenIDs = new Set(); return array; });
    }
  }, [buttonFlashing]);

  const updateStackPositions = (cardStacks) => {
    // TODO: explicitly check if we're minting so it can be handled differently
    if (cardStacks.justChanged.length > 2) { return; }

    setStackPositions(stackPositions => {
      const newStackPositions = [...stackPositions];
      newStackPositions.batchTokenIDs = stackPositions.batchTokenIDs;

      // Update quantities. If a stack is depleted, remove its stackPosition and
      // inform the parent that it has 'moved' so the parent can remove it too.
      for (let cardStack of cardStacks.justChanged) {
        const index = newStackPositions.findIndex(p => p.cardStack.tokenID === cardStack.tokenID);
        const visible = index !== -1;

        if (visible && cardStack.quantity === 0) {
          newStackPositions.splice(index, 1);
          setTimeout(() => onStackMoved({ cardStack, movedTo: null }), 0); // The void.
        } else if (visible) {
          // This change seems to be visible to the parent component which is good.
          newStackPositions[index].cardStack.quantity = cardStack.quantity;
        }

        // If a card was added, make the stack appear over the CardOutline. If the
        // stack is already visible, force a re-render by changing its key.
        if (cardStack.quantity > 0 && cardStack.lastDelta > 0) {

          // TODO: try to set z-index so fan is stacked in the expected order
          // TODO: don't flip over cards after the first?

          const position = layout.cardFanPosition(cardStack.tokenID, newStackPositions.batchTokenIDs);
          if (!position) { continue; } // The card stack is already positioned in the card fan.

          if (visible) {
            const existing = newStackPositions[index];

            existing.position = position;
            existing.generation = (existing.generation || 0) + 1;
            existing.fadeIn = false;
          } else {
            newStackPositions.splice(0, 0, { cardStack, position, fadeIn: false });
          }

          setTimeout(() => onStackMoved({ cardStack, movedTo: { cardOutline: true } }), 0);
          newStackPositions.batchTokenIDs.add(cardStack.tokenID);
        }
      }

      return newStackPositions;
    });
  };

  const key = (stackPosition) => `${stackPosition.cardStack.tokenID}-${stackPosition.generation}`;

  return (
    <div className={styles.cards_in_play}>
      {stackPositions.map(o => (
        <CardStack key={key(o)} cardStack={o.cardStack} startPosition={o.position} dealDelay={o.dealDelay} fadeIn={o.fadeIn} onMoved={onStackMoved} />
      ))}
    </div>
  );
};

const withBatchTokenIDs = (array) => {
  if (!array.batchTokenIDs) {
    array.batchTokenIDs = new Set();
  }

  return array;
}

export default CardsInPlay;
