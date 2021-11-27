import styles from "./styles.module.scss";

const CardBack = ({ defects }) => {
  if (!defects) { throw new Error("defects must be provided"); }

  return (
    <div className={`${styles.card_back} ${styles[`${defects.folded_corner}_folded_corner`]}`}></div>
  );
};

export default CardBack;
