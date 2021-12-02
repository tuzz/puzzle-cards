import VectorText from "../VectorText";
import styles from "./styles.module.scss";

const CardBack = ({ defects, isMasterCopy }) => {
  if (typeof defects === "undefined") { throw new Error("defects must be provided"); }
  if (typeof isMasterCopy === "undefined") { throw new Error("isMasterCopy must be provided"); }

  const classes = [
    styles.card_back,
    defects.folded_corner && styles[`clip_${defects.folded_corner.corner}`],
    isMasterCopy && styles.master_copy,
  ].filter(s => s).join(" ");

  return (
    <div className={classes}>
      <div className={styles.inner}>
        <VectorText className={styles.worship} text="Worship" />
        <VectorText className={styles.the_sun} text="the Sun" />


        <img className={styles.bottom_sun} src="/images/yellow_sun.png" />
        <img className={styles.left_sun} src="/images/yellow_sun.png" />
        <img className={styles.right_sun} src="/images/yellow_sun.png" />

        <span className={styles.puzzle_cards}>
          <VectorText className={styles.puzzle} text="Puzzle" />
          <VectorText className={styles.cards} text="Cards" />
        </span>
      </div>
    </div>
  );
};

export default CardBack;
