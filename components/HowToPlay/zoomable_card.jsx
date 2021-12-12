import { useState, useEffect } from "react";
import CardFront from "../CardFront";
import Zoomable from "../Zoomable";
import styles from "./styles.module.scss";

const ZoomableCard = ({ card, title, subtitle }) => {
  const [zoomed, setZoomed] = useState(false);
  const [zIndex, setZIndex] = useState(0);

  useEffect(() => {
    addEventListener("scroll", zoomOut);
    return () => removeEventListener("scroll", zoomOut);
  }, []);

  useEffect(() => {
    if (zoomed) {
      setZIndex(99999);
    } else {
      setTimeout(() => setZIndex(0), 500);
    }
  }, [zoomed]);

  const zoomOut = () => setZoomed(false);

  return <>
    <div className={styles.zoomable_card} style={{ zIndex }}>
      {title && <span className={styles.title}>{title}</span>}
      <Zoomable zoomed={zoomed}>
        <div className={styles.card} onClick={() => setZoomed(z => !z)}>
          <CardFront card={card} videoQuality="high" />
        </div>
      </Zoomable>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>

    <div className={`${styles.dark_background} ${zoomed && styles.visible}`} style={{ transitionDuration: "0.5s" }}></div>
  </>;
};

export default ZoomableCard;
