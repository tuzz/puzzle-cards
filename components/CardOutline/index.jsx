import { useRef } from "react";
import styles from "./styles.module.scss";

const CardOutline = ({ channel }) => {
  const ref = useRef();

  channel.overlapsOutline = (r1) => {
    const r2 = ref.current.getBoundingClientRect();

    return r1.left < r2.right && r1.right > r2.left
        && r1.bottom > r2.top && r1.top < r2.bottom;
  };

  return (
    <div ref={ref} className={styles.card_outline}></div>
  );
};

export default CardOutline;
