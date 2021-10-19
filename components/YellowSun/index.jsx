import { useRef, useEffect } from "react";
import styles from "./styles.module.scss";

const YellowSun = ({ className, channel = {} }) => {
  const yellowSunRef = useRef();

  useEffect(() => {
    setInterval(() => {
      console.log(rotationPhase(channel.worshipStickSunRef(), 8), rotationPhase(yellowSunRef, 24));
    }, 100);
  }, []);

  const rotationPhase = (ref, numberOfSpokes) => {
    if (!ref.current) { return 0; }

    const transform = getComputedStyle(ref.current).transform;
    const [_, a, b] = transform.split(/[(,]/).map(s => parseFloat(s));
    const radians = Math.atan2(b, a);
    const radiansPerSpoke = 2 * Math.PI / numberOfSpokes;
    const phase = (radians % radiansPerSpoke) / radiansPerSpoke;

    return phase < 0 ? 1 + phase : phase;
  };

  return (
    <div className={styles.hide_overflow}>
      <div className={`${styles.yellow_sun} ${className}`}>
        <img src="/images/yellow_sun.png" ref={yellowSunRef} />
      </div>
    </div>
  );
};

export default YellowSun;
