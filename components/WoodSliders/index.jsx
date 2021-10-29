import { useState, useEffect } from "react";
import styles from "./styles.module.scss";

const WoodSliders = () => {
  const [state, setState] = useState(0);

  useEffect(() => {
    const [stateName, transitionDelay] = patterns[state];

    if (stateName !== "initial") {
      setTimeout(nextState, transitionDelay);
    }
  }, [state]);

  const nextState = () => setState(i => (i + 1) % patterns.length);

  return (
    <div className={`${styles.wood_sliders} ${patterns[state][0]}_state`}>
      <div className={styles.left}>
        <button onClick={nextState} className={styles.hourglass}></button>
      </div>

      <div className={styles.right}>
        <button onClick={nextState} className={styles.hourglass}></button>
      </div>
    </div>
  );
};

const patterns = [
  ["initial", 1200],
  ["close_both", 1000],
  ["open_both", null],

  ["initial", 1000],
  ["close_both", 800],
  ["open_right_first", 600],
  ["open_left_second", null],

  ["initial", 1000],
  ["close_both", 800],
  ["open_left_first", 600],
  ["open_right_second", null],
];

export default WoodSliders;
