import { useContext, useState, useRef, useEffect } from "react";
import AppContext from "../AppRoot/context";
import CardStack from "../CardStack";
import styles from "./styles.module.scss";
const numRows = 2;

const CardsInPlay = ({ onStackMoved = () => {} }) => {
  const { address, decks } = useContext(AppContext);
  const [numColumns, setNumColumns] = useState(3);
  const cardStacks = address && decks[address] || [];

  return (
    <div className={styles.cards_in_play}>
      {placeStacks(numRows, numColumns, cardStacks).map(({ row, column, cardStack }) => (
        <CardStack key={cardStack.tokenID} cardStack={cardStack} onMoved={onStackMoved} />
      ))}
    </div>
  );
};

const placeStacks = (numRows, numColumns, cardStacks) => {
  const array = [];

  for (let row = 0; row < numRows; row += 1) {
    for (let column = 0; column < numColumns; column += 1) {
      const index = row * numColumns + column;
      if (index >= cardStacks.length) { return array; }

      array.push({ row, column, cardStack: cardStacks[index] });
    }
  }

  return array;
};

export default CardsInPlay;
