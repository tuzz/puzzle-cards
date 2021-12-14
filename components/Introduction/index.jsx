import CardBack from "../CardBack";
import styles from "./styles.module.scss";

const Introduction = () => (
  <div className={styles.introduction}>
    <div className={styles.top_section}>
      <div className={styles.card_fan}>
        <div className={styles.back}><CardBack defects={{}} isMasterCopy={false} /></div>
        <div className={styles.middle}><CardBack defects={{}} isMasterCopy={false} /></div>
        <div className={styles.front}><CardBack defects={{}} isMasterCopy={false} /></div>
      </div>

      <div className={styles.hero_text}>
        <p>An original card game by <a href="https://twitter.com/chrispatuzzo" target="_blank">Chris Patuzzo</a>.</p>

        <div className={styles.calls_to_action}>
          <a href="/how-to-play" target="_blank">Watch the video &gt;</a>
          <a href="/card-table" target="_blank">Play the game &gt;</a>
        </div>
      </div>
    </div>

    <div className={styles.table_edge}></div>
  </div>
);

export default Introduction;
