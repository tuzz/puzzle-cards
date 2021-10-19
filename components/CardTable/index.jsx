import { useState, useEffect } from "react";
import WorshipStick from "../WorshipStick";
import styles from "./styles.module.scss";

const CardTable = () => {
  const [raised, setRaised] = useState(true);

  useEffect(() => {
    setInterval(() => setRaised(r => !r), 5000);
  }, []);

  return (
    <div className={styles.card_table}>
      <WorshipStick className={styles.worship_stick} raised={raised} />
      <div className={styles.floor}></div>
    </div>
  );
};

export default CardTable;
