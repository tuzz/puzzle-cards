import { useState, useEffect } from "react";
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import styles from "./styles.module.scss";

const CardStack = ({ cardStack, startPosition, position, dealDelay, fadeIn = true, onMoved = () => {} }) => {
  const [dealing, setDealing] = useState(dealDelay && dealDelay > 0);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!dealDelay) { return; }

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

  const rotation = startPosition.rotation || { degrees: 0, random: 4 };
  const iframeSrc = `/embed?${cardStack.card.embedQueryString()}`;

  return (
    <Draggable bounds="parent" startPosition={startPosition} position={position} zoomed={zoomed} onClick={zoomIn} onStop={handleStop} disabled={zoomed} className={`${fadeIn && styles.fade_in}`}>
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
