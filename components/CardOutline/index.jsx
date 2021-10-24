import { useRef } from "react";
import styles from "./styles.module.scss";

const CardOutline = ({ channel }) => {
  const ref = useRef();

  channel.overlapsOutline = (movedTo) => {
    if (movedTo === null) { return false; }
    if (movedTo.cardOutline) { return true; }

    const outline = ref.current.getBoundingClientRect();

    return movedTo.left < outline.right && movedTo.right > outline.left
        && movedTo.bottom > outline.top && movedTo.top < outline.bottom;
  };

  return (
    <div ref={ref} className={styles.card_outline}></div>
  );
};

export default CardOutline;
