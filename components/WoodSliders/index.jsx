import { useState, useEffect } from "react";
import styles from "./styles.module.scss";

const WoodSliders = ({ filters, transactState, onButtonClick = () => {}, onSlidersClosed = () => {} }) => {
  const [state, setState] = useState(0);

  useEffect(() => {
    const [stateName, transitionDelay] = patterns[state];

    if (stateName !== "initial") {
      setTimeout(nextState, transitionDelay);
    }
  }, [state]);

  const nextState = () => {
    const [stateName, _] = patterns[state];

    if (stateName === "initial") { onButtonClick(); }
    if (stateName === "close_both") { onSlidersClosed(); }

    setState(i => (i + 1) % patterns.length)
  };

  const stateName = patterns[state][0];
  const disabled = stateName !== "initial" || !transactState.initial();
  const offScreen = filters.deck.length <= 6;

  return (
    <div className={`${styles.wood_sliders} ${stateName}_state ${offScreen && styles.off_screen}`}>
      <div className={styles.left}>
        <button onClick={nextState} disabled={disabled} className={styles.hourglass}></button>
      </div>

      <div className={styles.right}>
        <button onClick={nextState} disabled={disabled} className={styles.hourglass}></button>
      </div>

      <div className={styles.left_dashed_lines}>
        {[...Array(5).keys()].map(() => <div className={styles.line_dash}></div>)}
      </div>

      <div className={styles.right_dashed_lines}>
        {[...Array(5).keys()].map(() => <div className={styles.line_dash}></div>)}
      </div>
    </div>
  );
};

const patterns = [
  ["initial", 1000],
  ["align_cards", 1200],
  ["close_both", 1000],
  ["open_both", 1300],

  ["initial", 1000],
  ["align_cards", 1000],
  ["close_both", 800],
  ["open_right_first", 700],
  ["open_left_second", 1000],

  ["initial", 1000],
  ["align_cards", 1000],
  ["close_both", 800],
  ["open_left_first", 700],
  ["open_right_second", 1000],
];

export default WoodSliders;
