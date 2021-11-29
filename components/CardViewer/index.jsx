import { useEffect, useRef } from "react";
import CardFront from "../CardFront";
import styles from "./styles.module.scss";

const CardViewer = ({ card }) => {
  const ref = useRef();

  const handleClick = (event) => {
    ref.current.requestFullscreen();
  };

  return (
    <div className={styles.card_viewer} ref={ref} onClick={handleClick}>
      <div className={styles.card}>
        <CardFront card={card} />
      </div>
    </div>
  );
};

export default CardViewer;
