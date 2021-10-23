import { useState, useEffect } from "react";
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const CardStack = ({ cardStack, startPosition, onMoved = () => {} }) => {
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const zoomIn = () => {
    setZoomed(true);
    setTimeout(() => {
      addEventListener("mousedown", zoomOut);
      addEventListener("scroll", zoomOut);
    }, 0);
  };

  const zoomOut = () => {
    removeEventListener("mousedown", zoomOut);
    setZoomed(false);
  };

  const handleStop = (event) => {
    if (!zoomed) {
      onMoved({ cardStack, movedTo: event.target.getBoundingClientRect() });
    }
  };

  const iframeSrc = `/embed?${cardStack.card.embedQueryString()}`;

  return (
    <Draggable bounds="parent" startPosition={startPosition} onClick={zoomIn} onStop={handleStop} disabled={zoomed} className={styles.draggable}>
      <Zoomable zoomed={zoomed} rotateWhenZoomedOut={true} rotation={{ base: 0, random: 4 }}>
        <Flippable flipped={!loaded} direction={-1} className={styles.flippable}>
          <iframe src={iframeSrc} onLoad={() => setLoaded(true)} className={styles.iframe}>
            Your browser does not support iframes.
          </iframe>

          <div className={styles.back}>back</div>
        </Flippable>
      </Zoomable>
    </Draggable>
  );
};

export default CardStack;
