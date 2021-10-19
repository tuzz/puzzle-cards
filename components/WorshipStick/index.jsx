import styles from "./styles.module.scss";

const WorshipStick = ({ className, spinning = true, rockHeight = 1 }) => {
  const paddingTop = `${rockHeight * 100}%`;

  return (
    <div className={`${styles.worship_stick} ${className}`}>
      <img src="/images/worship_stick_base.png" className={styles.base} />
      <img src="/images/worship_stick_sun.png" className={`${styles.sun} ${!spinning && styles.paused}`} />

      {rockHeight > 0 && <div className={styles.rock} style={{ paddingTop }}></div>}
    </div>
  );
};

export default WorshipStick;
