import styles from "./styles.module.scss";

const CardFrame = ({ card }) => {
  const queryString = new URLSearchParams(card).toString();

  return (
    <iframe src={`/frame?${queryString}`} className={styles.card_frame}>
      Your browser does not support iframes.
    </iframe>
  );
};

export default CardFrame;
