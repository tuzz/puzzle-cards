import { useContext, useRef, useState, useEffect } from "react";
import AppContext from "../AppRoot/context"
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const MintChip = ({ filters }) => {
  const { PuzzleCard } = useContext(AppContext);
  const [zoomed, setZoomed] = useState(false);

  const zoomIn = () => {
    setZoomed(true);
    setTimeout(() => {
      addEventListener("mousedown", zoomOut);
      addEventListener("scroll", zoomOut);
    }, 0);
  };

  const zoomOut = (event) => {
    removeEventListener("mousedown", zoomOut);
    removeEventListener("scroll", zoomOut);
    setZoomed(false);
  };

  const rotation = { base: 0, random: 30, initial: -20 };
  const slidersOffScreen = filters.deck.length <= 6;

  return (
    <Draggable bounds="parent" zoomed={zoomed} onClick={zoomIn} disabled={zoomed} className={`${styles.draggable} ${slidersOffScreen && styles.sliders_off_screen}`}>
      <Zoomable zoomed={zoomed} rotateWhenZoomedOut={true} rotation={rotation} duration={1.5} minWidth={800} minHeight={800}>
        <Flippable flipped={zoomed} direction={Math.random() < 0.5 ? 1 : -1} delay={zoomed ? 0 : 0.5} className={styles.flippable}>
          <div className={styles.front}>
            <img src={`/images/poker_chip_black.png`} />
            <div className={`${styles.content} ${styles.dark_mode}`}>
              <span className={styles.mint}>Mint</span>
              <span className={styles.price}>$0.01</span>
            </div>
          </div>

          <div className={styles.back}>
            <img src={`/images/poker_chip_white.png`} />
            <div className={styles.content}>
              <span className={styles.mint}>Mint</span>
              <span className={styles.price}>$0.01</span>
            </div>
          </div>
        </Flippable>
      </Zoomable>
    </Draggable>
  );
};

export default MintChip;
