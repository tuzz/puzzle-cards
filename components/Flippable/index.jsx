import { useState } from "react";
import styles from "./styles.module.scss";

const Flippable = ({ flipped = false, direction = 1, className, children = [] }) => {
  if (children.length !== 2) { throw new Error("Expected 2 children"); }

  const [rotation, setRotation] = useState(0);

  const expectedFlipped = flipped;
  const actualFlipped = rotation % 360 != 0;

  if (actualFlipped != expectedFlipped) {
    setRotation(r => r + 180 * direction);
  }

  return (
    <div className={`${styles.three_d_space} ${className}`}>
      <div className={styles.flippable} style={{ transform: `rotateY(${rotation}deg)` }}>
        <div className={styles.front}>{children[0]}</div>
        <div className={styles.back}>{children[1]}</div>
      </div>
    </div>
  );
};

export default Flippable;
