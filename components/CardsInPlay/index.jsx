import { useContext, useState, useRef, useEffect } from "react";
import AppContext from "../AppRoot/context";
import CardStack from "../CardStack";
import styles from "./styles.module.scss";

const numRows = 2;
const stackWidth = 15 * 16; // As per the CardStack css rules.
const stackHeight = 21 * 16; // As per the CardStack css rules.
const stackMargin = 5 * 16; // The minimum margin between card stacks.
const pagePadding = 5 * 16; // The horizontal page padding on the left/right.
const playAreaTop = 37 * 16;

const CardsInPlay = ({ onStackMoved = () => {} }) => {
  const { address, decks } = useContext(AppContext);
  const [numColumns, setNumColumns] = useState(numColumnsBasedOnPageWidth());

  const cardStacks = address && decks[address] || []; // TODO: filters
  const positions = evenPositions(numRows, numColumns, cardStacks.length);

  return (
    <div className={styles.cards_in_play}>
      {positions.map(({ left, top }, i) => (
        cardStacks[i] && <CardStack key={cardStacks[i].tokenID} cardStack={cardStacks[i]} startPosition={{ left, top }} onMoved={onStackMoved} />
      ))}
    </div>
  );
};

const numColumnsBasedOnPageWidth = () => {
  if (typeof window === "undefined") { return 0; }

  const pageWidth = window.innerWidth;
  const playAreaWidth = pageWidth - 2 * pagePadding;
  const perPlaceWidth = stackWidth + stackMargin;
  const numColumns = Math.floor(playAreaWidth / perPlaceWidth);

  return numColumns;
}

const evenPositions = (numRows, numColumns, numCards) => {
  if (typeof window === "undefined") { return []; }

  const pageWidth = window.innerWidth;
  const perPlaceWidth = stackWidth + stackMargin;
  const perPlaceHeight = stackHeight + stackMargin;
  const equalPerRow = Math.ceil(numCards / numRows);
  const maxCardsPerRow = Math.max(3, Math.min(numColumns, equalPerRow));
  const positions = [];

  for (let row = 0; row < numRows; row += 1) {
    const remainingCards = numCards - row * maxCardsPerRow;
    const cardsInRow = Math.min(remainingCards, maxCardsPerRow);

    const cardsWidth = cardsInRow * perPlaceWidth;
    const leftPadding = (pageWidth - cardsWidth + stackMargin / 2) / 2;

    for (let column = 0; column < cardsInRow; column += 1) {
      const left = leftPadding + perPlaceWidth * column;
      const top = playAreaTop + row * perPlaceHeight;

      positions.push({ left, top });
    }
  }

  return positions;
};

export default CardsInPlay;
