import { useContext, useState, useEffect } from "react";
import AppContext from "../AppRoot/context";
import Metamask from "./metamask";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import DragRegion from "../DragRegion";
import PlayingCard from "../PlayingCard";
import CardOutline from "../CardOutline";
import styles from "./styles.module.scss";

const CardTable = () => {
  const { PuzzleCard, decks, address } = useContext(AppContext);
  const [chosenCards, setChosenCards] = useState([]);
  const [buttonAction, setButtonAction] = useState();

  const [raised, setRaised] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const channel = {};

  useEffect(() => {
    setInterval(() => setRaised(r => !r), 14000);
    setInterval(() => setFlipped(r => !r), 3000);
    setInterval(() => setDirection(d => -d), 10000);
  }, []);

  const handleCardMoved = ({ card, movedTo }) => {
    const expectedChosen = channel.overlapsOutline(movedTo);
    const actualChosen = chosenCards.indexOf(card) !== -1;

    if (expectedChosen && !actualChosen) {
      setChosenCards(array => [...array, card]);
    } else if (!expectedChosen && actualChosen) {
      setChosenCards(array => array.filter(c => c !== card));
    }
  };

  useEffect(async () => {
    const actionNames = await Metamask.actionsThatCanBeTaken(PuzzleCard, chosenCards);

    setButtonAction(
      actionNames.length === 1 ? actionNames[0] :
      actionNames.length > 1 ? actionNames.filter(n => n !== "discard2Pickup1") :
      !address ? "connectToMetamask" :
      null
    );
  }, [chosenCards, address]);

  const performAction = async () => {
    const success = await Metamask.performAction(PuzzleCard, buttonAction, chosenCards);
  };

  const stickSpinning = buttonAction && buttonAction !== "connectToMetamask";

  return (
    <div className={styles.card_table}>
      <WorshipStick rockHeight={0.8} spinning={stickSpinning} buttonEnabled={!!buttonAction} onButtonClick={performAction} raised={raised} className={styles.worship_stick} channel={channel} />
      <YellowSun raised={raised} channel={channel} />

      <TableEdge ratioOfScreenThatIsTableOnPageLoad={0.15}>
        <DragRegion>
          <PlayingCard card={address && decks[address].length >= 1 && decks[address][0].card} onMoved={handleCardMoved} />
          <PlayingCard card={address && decks[address].length >= 2 && decks[address][1].card} onMoved={handleCardMoved} />
        </DragRegion>

        <div className={styles.felt_cloth}>
          <CardOutline channel={channel} />
        </div>
      </TableEdge>
    </div>
  );
};

export default CardTable;
