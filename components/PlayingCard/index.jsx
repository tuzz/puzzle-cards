import { useState, useEffect } from "react";
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const PlayingCard = ({ card }) => {
  const [zoomed, setZoomed] = useState(false);

  const handleCardClick = () => {
    setZoomed(true);
    setTimeout(() => {
      addEventListener("mousedown", zoomOut);
      addEventListener("scroll", zoomOut);
    }, 0);
  };

  const zoomOut = (event) => {
    removeEventListener("mousedown", zoomOut);
    setZoomed(false);
  };

  return (
    <Draggable bounds="parent" onClick={handleCardClick} disabled={zoomed} className={styles.draggable}>
      <Zoomable zoomed={zoomed}>
        <Flippable flipped={false} direction={-1} className={styles.flippable}>
          <iframe src={`/embed?${card && card.embedQueryString()}`} className={styles.iframe}>
            Your browser does not support iframes.
          </iframe>

          <div className={styles.back}>back</div>
        </Flippable>
      </Zoomable>
    </Draggable>
  );
};

export default PlayingCard;
