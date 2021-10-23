import { useContext, useState, useRef, useEffect } from "react";
import AppContext from "../AppRoot/context";
import PlayingCard from "../PlayingCard";
import styles from "./styles.module.scss";
const numberOfRows = 2;

const CardsInPlay = ({ onCardMoved = () => {} }) => {
  const { address, decks } = useContext(AppContext);
  const [cardsPerRow, setCardsPerRow] = useState(3);
  const cardStacks = address && decks[address] || [];

  return (
    <div className={styles.cards_in_play}>
      {placeCards(numberOfRows, cardsPerRow, cardStacks).map(({ row, column, cardStack }) => (
        <PlayingCard key={cardStack.tokenID} cardStack={cardStack} onMoved={onCardMoved} />
      ))}
    </div>
  );
};

const placeCards = (numberOfRows, cardsPerRow, cardStacks) => {
  const array = [];

  for (let row = 0; row < numberOfRows; row += 1) {
    for (let column = 0; column < cardsPerRow; column += 1) {
      const index = row * cardsPerRow + column;
      if (index >= cardStacks.length) { return array; }

      array.push({ row, column, cardStack: cardStacks[index] });
    }
  }

  return array;
};

export default CardsInPlay;
