import { useContext, useState, useRef, useEffect } from "react";
import AppContext from "../AppRoot/context";
import CardStack from "../CardStack";
import layout from "./layout";
import styles from "./styles.module.scss";

const CardsInPlay = ({ onStackMoved = () => {}, buttonFlashing }) => {
  const { address, decks } = useContext(AppContext);
  const [loadedAddress, setLoadedAddress] = useState(address);
  const [stackPositions, setStackPositions] = useState([]);
  const [batchTokenIDs, setBatchTokenIDs] = useState(new Set());

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
  useEffect(() => buttonFlashing && setBatchTokenIDs([]), [buttonFlashing]);

  const updateStackPositions = (cardStacks) => {
    const newStackPositions = [...stackPositions]; // TODO: try to write with setState in case of races
    const newBatchTokenIDs = new Set(batchTokenIDs);

    const pageMiddle = document.body.clientWidth / 2;

    // Update quantities. If a stack is depleted, remove its stackPosition and
    // inform the parent that it has 'moved' so the parent can remove it too.
    for (let cardStack of cardStacks.justChanged) {
      const index = newStackPositions.findIndex(p => p.cardStack.tokenID === cardStack.tokenID);
      const visible = index !== -1;

      if (visible && cardStack.quantity === 0) {
        newStackPositions.splice(index, 1);
        onStackMoved({ cardStack, movedTo: null }); // The void.
      } else if (visible) {
        // This change seems to be visible to the parent component which is good.
        newStackPositions[index].cardStack.quantity = cardStack.quantity;
      }

      // If a card was added, make the stack appear over the CardOutline. If the
      // stack is already visible, force a re-render by changing its key.
      if (cardStack.quantity > 0 && cardStack.lastDelta > 0) {
        const left = pageMiddle - layout.stackWidth / 2;
        const top = layout.outlineTop;

        // Fan the cards out if lots are minted but don't go outside the card outline.
        const numMinted = newBatchTokenIDs.size;
        const fanAngle = 3 * numMinted;
        const fanOffset = Math.min(10 * numMinted, layout.stackWidth - 50);

        // TODO: try to set z-index so fan is stacked in the expected order
        // TODO: don't flip over cards after the first?

        const rotation = { degrees: 0, random: 4, initial: fanAngle };
        const position = { left: left + fanOffset, top, rotation };
        const fadeIn = false;

        if (visible) {
          const existing = newStackPositions[index];

          existing.position = position;
          existing.generation = (existing.generation || 0) + 1;
          existing.fadeIn = fadeIn;
        } else {
          newStackPositions.splice(0, 0, { cardStack, position, fadeIn });
        }

        onStackMoved({ cardStack, movedTo: { cardOutline: true } });
        newBatchTokenIDs.add(cardStack.tokenID);
      }
    }

    setStackPositions(newStackPositions);
    setBatchTokenIDs(newBatchTokenIDs);
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

export default CardsInPlay;
