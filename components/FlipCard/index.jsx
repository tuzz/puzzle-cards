import { useState } from "react";
import styles from "./styles.module.scss";

const FlipCard = ({ flipped = false, direction = 1 }) => {
  const [rotation, setRotation] = useState(0);

  const expectedFlipped = flipped;
  const actualFlipped = rotation % 360 != 0;

  if (actualFlipped != expectedFlipped) {
    setRotation(r => r + 180 * direction);
  }

  return (
    <div className={styles.three_d_space}>
      <div className={styles.card} style={{ transform: `rotateY(${rotation}deg)` }}>
        <div className={styles.front}>front</div>
        <div className={styles.back}>back</div>
      </div>
    </div>
  );
};

export default FlipCard;
