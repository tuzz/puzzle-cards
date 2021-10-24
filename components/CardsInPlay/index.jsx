import { useContext, useState, useRef, useEffect } from "react";
import AppContext from "../AppRoot/context";
import CardStack from "../CardStack";
import styles from "./styles.module.scss";

const numRows = 2;
const oneRem = 16;
const stackWidth = 15 * oneRem; // As per the CardStack css rules.
const stackHeight = 21 * oneRem; // As per the CardStack css rules.
const stackMargin = 5 * oneRem; // The minimum margin between card stacks.
const pagePadding = 5 * oneRem; // The horizontal page padding on the left/right.
const outlineTop = 11.2 * oneRem;
const playAreaTop = outlineTop + stackHeight + 5 * oneRem;

const CardsInPlay = ({ onStackMoved = () => {} }) => {
  const { address, decks } = useContext(AppContext);
  const [loadedAddress, setLoadedAddress] = useState(address);
  const [stackPositions, setStackPositions] = useState([]);

  useEffect(() => {
    if (!address) { return; }

    const cardStacks = decks[address];
    if (!cardStacks.fetched) { setLoadedAddress(); setStackPositions([]); return; }

    if (address === loadedAddress) { updateStackPositions(cardStacks); return; }

    setStackPositions([]);
    setLoadedAddress(address);

    const numColumns = numColumnsBasedOnPageWidth();
    const positions = evenPositions(numRows, numColumns, cardStacks.length);

    setStackPositions(positions.map((position, i) => (
      { cardStack: cardStacks[i], position, dealDelay: i * 150, fadeIn: true }
    )));

    // TODO: when paginating, deal cards backwards if going back a page
  }, [address, decks]);

  const updateStackPositions = (cardStacks) => {
    const newStackPositions = [...stackPositions];
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
        const left = pageMiddle - stackWidth / 2;
        const top = outlineTop;

        const rotation = { degrees: 0, random: 4, startRandom: false };
        const position = { left, top, rotation };
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
      }
    }

    setStackPositions(newStackPositions);
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

const numColumnsBasedOnPageWidth = () => {
  if (typeof document === "undefined") { return 0; }

  const pageWidth = document.body.clientWidth;
  const playAreaWidth = pageWidth - 2 * pagePadding;
  const perPlaceWidth = stackWidth + stackMargin;
  const numColumns = Math.floor(playAreaWidth / perPlaceWidth);

  return numColumns;
}

const evenPositions = (numRows, numColumns, numCards) => {
  if (typeof document === "undefined") { return []; }

  const pageWidth = document.body.clientWidth;
  const perPlaceWidth = stackWidth + stackMargin;
  const perPlaceHeight = stackHeight + stackMargin;
  const equalPerRow = Math.ceil(numCards / numRows);
  const softMaxCardsPerRow = Math.max(3, Math.min(numColumns, equalPerRow));
  const compressedMode = softMaxCardsPerRow > numColumns;
  const maxCardsPerRow = compressedMode && numCards <= 4 ? 2 : softMaxCardsPerRow;
  const positions = [];

  for (let row = 0; row < numRows; row += 1) {
    const remainingCards = numCards - row * maxCardsPerRow;
    const cardsInRow = Math.min(remainingCards, maxCardsPerRow);

    if (compressedMode) {
      const reducedPadding = pagePadding / 3;
      const availableWidth = pageWidth - reducedPadding * 2 - stackWidth;
      const perPlaceOffset = availableWidth / (cardsInRow - 1);

      for (let column = 0; column < cardsInRow; column += 1) {
        let left, degrees;

        if (cardsInRow > 1) {
          left = reducedPadding + perPlaceOffset * column;
          degrees = column / (cardsInRow - 1) * 8 - 4;
        } else {
          left = reducedPadding + availableWidth / 2;
          degrees = 0;
        }

        const top = playAreaTop + row * perPlaceHeight;
        positions.push({ left, top, rotation: { degrees, random: 0 } });
      }
    } else {
      const cardsWidth = cardsInRow * perPlaceWidth;
      const leftPadding = (pageWidth - cardsWidth + stackMargin / 2) / 2;

      for (let column = 0; column < cardsInRow; column += 1) {
        const left = leftPadding + perPlaceWidth * column;
        const top = playAreaTop + row * perPlaceHeight;

        positions.push({ left, top });
      }
    }
  }

  return positions;
};

export default CardsInPlay;
