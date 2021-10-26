import { useRef } from "react";
import styles from "./styles.module.scss";

const CardOutline = ({ channel }) => {
  const ref = useRef();

  channel.overlapsOutline = (position) => {
    if (position === null) { return false; }
    if (position.cardOutline) { return true; }

    const outline = ref.current.getBoundingClientRect();

    return position.left < outline.right && position.right > outline.left
        && position.bottom > outline.top && position.top < outline.bottom;
  };

  channel.overlapsYOfTheBottomOfOutline = (position) => {
    if (position === null) { return false; }
    if (position.cardOutline) { return true; }

    const outline = ref.current.getBoundingClientRect();

    return position.top < outline.bottom;
  };

  return (
    <div ref={ref} className={styles.card_outline}></div>
  );
};

export default CardOutline;
