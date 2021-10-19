import styles from "./styles.module.scss";

const WorshipStick = ({ className, spinning = true }) => {
  return (
    <div className={`${styles.worship_stick} ${className}`}>
      <img src="/images/worship_stick_base.png" className={styles.base} />
      <img src="/images/worship_stick_sun.png" className={`${styles.sun} ${!spinning && styles.paused}`} />
    </div>
  );
};

export default WorshipStick;
