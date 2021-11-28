import styles from "./styles.module.scss";

const CardBack = ({ defects, isMasterCopy }) => {
  if (typeof defects === "undefined") { throw new Error("defects must be provided"); }
  if (typeof isMasterCopy === "undefined") { throw new Error("isMasterCopy must be provided"); }

  const classes = [
    styles.card_back,
    styles[`${defects.folded_corner}_folded_corner`],
    isMasterCopy && styles.master_copy,
  ].filter(s => s).join(" ");

  return (
    <div className={classes}></div>
  );
};

export default CardBack;
