import { useContext, useRef, useState, useEffect } from "react";
import AppContext from "../AppRoot/context"
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import Dropdown from "./dropdown";
import styles from "./styles.module.scss";

const MintChip = ({ filters }) => {
  const { PuzzleCard } = useContext(AppContext);
  const [zoomed, setZoomed] = useState(false);
  const [numCards, setNumCards] = useState(1);
  const [tier, setTier] = useState(0);

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
            <div className={styles.safari_blurry_text_fix}>
              <div className={styles.content}>
                <span className={styles.mint}>Mint</span>
                <span className={styles.price}>$0.01</span>

                <Dropdown className={styles.number_dropdown} value={numCards} onChange={setNumCards} options={[
                  { label: "1 card", value: 1 },
                  { label: "2 cards", value: 2 },
                  { label: "5 cards", value: 5 },
                  { label: "10 cards", value: 10 },
                  { label: "20 cards", value: 20 },
                  { label: "50 cards", value: 50 },
                  { label: "100 cards", value: 100 },
                  { label: "200 cards", value: 200 },
                  { label: "500 cards", value: 500 },
                ]} />

                <Dropdown className={styles.tier_dropdown} value={tier} onChange={setTier} options={
                  PuzzleCard.TIER_NAMES.map((label, value) => ({ label, value }))
                } />
              </div>
            </div>
          </div>
        </Flippable>
      </Zoomable>
    </Draggable>
  );
};

export default MintChip;
