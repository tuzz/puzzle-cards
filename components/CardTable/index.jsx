import { useState, useEffect } from "react";
import YellowSun from "../YellowSun";
import WorshipStick from "../WorshipStick";
import TableEdge from "../TableEdge";
import styles from "./styles.module.scss";

const CardTable = () => {
  const [raised, setRaised] = useState(false);
  const channel = {};

  useEffect(() => {
    setInterval(() => setRaised(r => !r), 14000);
  }, []);

  return (
    <div className={styles.card_table}>
      <WorshipStick className={styles.worship_stick} rockHeight={0.8} raised={raised} channel={channel} />
      <YellowSun raised={raised} channel={channel} />
      <TableEdge ratioOfScreenThatIsTableOnPageLoad={0.1}>

      </TableEdge>
    </div>
  );
};

export default CardTable;
