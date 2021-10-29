import styles from "./styles.module.scss";

const WoodSliders = () => {
  return (
    <div className={styles.wood_sliders}>
      <div className={styles.left}>
        <button className={styles.hourglass}></button>
      </div>

      <div className={styles.right}>
        <button className={styles.hourglass}></button>
      </div>
    </div>
  );
};

export default WoodSliders;
