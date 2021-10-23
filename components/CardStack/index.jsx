import { useState, useEffect } from "react";
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const CardStack = ({ cardStack, startPosition, dealDelay = 0, onMoved = () => {} }) => {
  const [dealing, setDealing] = useState(dealDelay > 0);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (dealDelay === 0) { return; }

    const timeout = setTimeout(() => setDealing(false), dealDelay);
    return () => clearTimeout(timeout);
  }, []);

  if (dealing) { return null; }

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

  const angle = startPosition.angle;
  const rotation = typeof angle === "undefined" ? { base: 0, random: 4 } : { base: angle, random: 0 };

  const iframeSrc = `/embed?${cardStack.card.embedQueryString()}`;

  return (
    <Draggable bounds="parent" startPosition={startPosition} onClick={zoomIn} onStop={handleStop} disabled={zoomed} className={styles.draggable}>
      <Zoomable zoomed={zoomed} rotateWhenZoomedOut={true} rotation={rotation}>
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
