import { useState } from "react";
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const MintChip = ({ filters }) => {
  const [zoomed, setZoomed] = useState(false);

  const zoomIn = () => {
    setZoomed(true);
    setTimeout(() => {
      addEventListener("mousedown", zoomOut);
      addEventListener("scroll", zoomOut);
    }, 0);
  };

  const zoomOut = () => {
    removeEventListener("mousedown", zoomOut);
    removeEventListener("scroll", zoomOut);
    setZoomed(false);
  };

  const rotation = { base: 0, random: 90 };
  const slidersOffScreen = filters.deck.length <= 6;

  return (
    <Draggable bounds="parent" zoomed={zoomed} onClick={zoomIn} disabled={zoomed} className={`${styles.draggable} ${slidersOffScreen && styles.sliders_off_screen}`}>
      <Zoomable zoomed={zoomed} rotateWhenZoomedOut={true} rotation={rotation} duration={2}>
        <Flippable flipped={zoomed} direction={Math.random() < 0.5 ? 1 : -1} delay={zoomed ? 0 : 0.75} className={styles.flippable}>
          <div className={styles.front}></div>
          <div className={styles.back}></div>
        </Flippable>
      </Zoomable>
    </Draggable>
  );
};

export default MintChip;
