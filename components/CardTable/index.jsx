import WorshipStick from "../WorshipStick";
import styles from "./styles.module.scss";

const CardTable = () => (
  <div className={styles.card_table}>
    <WorshipStick className={styles.worship_stick} />
    <div className={styles.floor}></div>
  </div>
);

export default CardTable;
