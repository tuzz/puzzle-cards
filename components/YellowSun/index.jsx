import styles from "./styles.module.scss";

const YellowSun = ({ className }) => (
  <div className={styles.hide_overflow}>
    <div className={`${styles.yellow_sun} ${className}`}>
      <img src="/images/yellow_sun.png" />
    </div>
  </div>
);

export default YellowSun;
