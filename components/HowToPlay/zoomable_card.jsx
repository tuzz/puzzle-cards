import { useState } from "react";
import CardFront from "../CardFront";
import Zoomable from "../Zoomable";
import styles from "./styles.module.scss";

const ZoomableCard = ({ card, title, subtitle }) => {
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

  return (
    <div className={styles.zoomable_card}>
      {title && <span className={styles.title}>{title}</span>}
      <Zoomable zoomed={zoomed}>
        <div className={styles.card} onClick={zoomIn}>
          <CardFront card={card} videoQuality="high" />
        </div>
      </Zoomable>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  );
};

export default ZoomableCard;
