import { useEffect, useRef } from "react";
import CardFront from "../CardFront";
import styles from "./styles.module.scss";

const CardViewer = ({ card, referrer }) => {
  const ref = useRef();

  const handleClick = (event) => {
    ref.current.requestFullscreen();
  };

  // Present CardViewer differently depending on how the user arrived at this page.
  // e.g don't show the felt background when taking screenshots in ./bin/generate_images
  const referrerClass = `referrer_${referrer}`;

  return (
    <div className={`${styles.card_viewer} ${referrerClass}`} ref={ref} onClick={handleClick}>
      <div className={styles.card}>
        <CardFront card={card} />
      </div>
    </div>
  );
};

export default CardViewer;
