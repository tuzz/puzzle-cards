import { useEffect, useState, useRef } from "react";
import Flippable from "../Flippable";
import CardFront from "../CardFront";
import CardBack from "../CardBack";
import styles from "./styles.module.scss";

const CardViewer = ({ card, referrer }) => {
  const [flipped, setFlipped] = useState(false);
  const [flipDirection, setFlipDirection] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const ref = useRef();

  const random = CardFront.stableRandom(card);
  const defects = CardFront.randomDefects(card, random);

  const toggleFullscreen = () => {
    if (referrer !== "animation_url") { return; }

    setFullscreen(previous => {
      const fullscreen = !previous;
      const e = ref.current;

      if (fullscreen) {
        if (e.requestFullscreen) {
          e.requestFullscreen();
        } else if (e.webkitRequestFullscreen) { /* Safari */
          e.webkitRequestFullscreen();
        } else if (e.msRequestFullscreen) { /* IE11 */
          e.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      }

      return fullscreen;
    });
  };

  const flipCard = (direction) => {
    setFlipped(f => !f);
    setFlipDirection(direction);
  };

  // Present CardViewer differently depending on how the user arrived at this page.
  // e.g don't show the felt background when taking screenshots in ./bin/generate_images
  const referrerClass = `referrer_${referrer}`;

  return (
    <div className={`${styles.card_viewer} ${referrerClass}`} ref={ref}>
      <button onClick={() => flipCard(-1)} className={`${styles.tick_mark} ${styles.flip_left}`}></button>

      <div className={styles.card} onClick={() => toggleFullscreen()}>
        <Flippable flipped={flipped} direction={flipDirection} className={styles.flippable}>
          <CardFront card={card} random={random} defects={defects} scaleShadows={true} videoQuality="high" />
          <CardBack defects={defects} scaleShadows={true} isMasterCopy={card.edition === "Master Copy"} />
        </Flippable>
      </div>

      <button onClick={() => flipCard(1)} className={`${styles.tick_mark} ${styles.flip_right}`}></button>

      <a className={styles.link_to_site} href="https://puzzlecards.github.io">puzzlecards.github.io</a>
    </div>
  );
};

export default CardViewer;
