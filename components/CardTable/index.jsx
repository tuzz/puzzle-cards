import { useContext, useState, useEffect } from "react";
import AppContext from "../AppContext";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import PlayingCard from "../PlayingCard";
import styles from "./styles.module.scss";

const CardTable = () => {
  const { decks, address } = useContext(AppContext);

  const [raised, setRaised] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(1);
  const channel = {};

  useEffect(() => {
    setInterval(() => setRaised(r => !r), 14000);
    setInterval(() => setFlipped(r => !r), 3000);
    setInterval(() => setDirection(d => -d), 10000);
  }, []);

  return (
    <div className={styles.card_table}>
      <WorshipStick className={styles.worship_stick} rockHeight={0.8} raised={raised} channel={channel} />
      <YellowSun raised={raised} channel={channel} />

      <TableEdge ratioOfScreenThatIsTableOnPageLoad={0.1}>
        <div className={styles.draggable_area}>
          <PlayingCard />
          <PlayingCard />
        </div>

        <div className={styles.felt_cloth}></div>
      </TableEdge>
    </div>
  );
};

export default CardTable;
