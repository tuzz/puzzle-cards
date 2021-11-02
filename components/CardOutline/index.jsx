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

  channel.circleOverlapsOutline = (position) => {
    const radius = position.width / 2;

    const centerX = position.left + radius;
    const centerY = position.top + radius;

    const outline = ref.current.getBoundingClientRect();

    // Find the point inside the rectangle closest to the circle's center.
    const closestX = Math.min(Math.max(centerX, outline.left), outline.right);
    const closestY = Math.min(Math.max(centerY, outline.top), outline.bottom);

    return (closestX - centerX) ** 2 + (closestY - centerY) ** 2 < radius ** 2;
  };

  return (
    <div ref={ref} className={styles.card_outline}></div>
  );
};

export default CardOutline;
