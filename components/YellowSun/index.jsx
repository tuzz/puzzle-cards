import styles from "./styles.module.scss";

const YellowSun = ({ className }) => (
  <div className={`${styles.yellow_sun} ${className}`}>
    <img src="/images/yellow_sun.png" />
  </div>
);

export default YellowSun;
