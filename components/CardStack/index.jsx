import { useState, useEffect, useRef } from "react";
import Draggable from "../Draggable";
import Zoomable from "../Zoomable";
import Flippable from "../Flippable";
import CardFront from "../CardFront";
import CardBack from "../CardBack";
import CardMenu from "../CardMenu";
import styles from "./styles.module.scss";

const CardStack = ({ cardStack, startPosition, position, withinY, dealDelay, fadeIn = true, flipped, flipDirection = 1, onMoved = () => {} }) => {
  const [dealing, setDealing] = useState(dealDelay && dealDelay > 0);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const random = CardFront.stableRandom(cardStack.card);
  const defects = CardFront.randomDefects(cardStack.card, random);

  const menuRef = useRef();

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

  const zoomOut = (event) => {
    const path = event.path || (event.composedPath && event.composedPath());
    if (path.some(node => node === menuRef.current)) { return; }

    removeEventListener("mousedown", zoomOut);
    removeEventListener("scroll", zoomOut);
    setZoomed(false);
  };

  const handleStop = (event) => {
    if (!zoomed) {
      onMoved({ cardStack, movedTo: event.target.getBoundingClientRect() });
    }
  };

  const rotation = (position || {}).rotation || startPosition.rotation || { base: 0, random: 4 };

  return <>
    <Draggable bounds="parent" startPosition={startPosition} position={position} withinY={withinY} zoomed={zoomed} onClick={zoomIn} onStop={handleStop} disabled={zoomed} className={`${fadeIn && styles.fade_in}`}>
      <Zoomable zoomed={zoomed} rotateWhenZoomedOut={true} rotation={rotation}>
        <Flippable flipped={!loaded || flipped} direction={flipDirection} className={styles.flippable}>
          <CardFront card={cardStack.card} random={random} defects={defects} videoQuality="low" onLoaded={() => setLoaded(true)} />
          <CardBack defects={defects} isMasterCopy={cardStack.card.edition === "Master Copy"} />
        </Flippable>
      </Zoomable>
    </Draggable>

    <CardMenu menuRef={menuRef} cardStack={cardStack} visible={zoomed} />
  </>;
};

export default CardStack;
