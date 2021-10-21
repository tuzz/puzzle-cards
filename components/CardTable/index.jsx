import { useContext, useState, useEffect } from "react";
import AppContext from "../AppRoot/context";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import DragRegion from "../DragRegion";
import PlayingCard from "../PlayingCard";
import CardOutline from "../CardOutline";
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

      <TableEdge ratioOfScreenThatIsTableOnPageLoad={0.15}>
        <DragRegion>
          <PlayingCard onMoved={x => console.log(x)} />
          <PlayingCard onMoved={x => console.log(x)} />
        </DragRegion>

        <div className={styles.felt_cloth}>
          <CardOutline />
        </div>
      </TableEdge>
    </div>
  );
};

export default CardTable;
