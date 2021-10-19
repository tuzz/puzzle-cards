import { useState, useRef, useEffect } from "react";
import styles from "./styles.module.scss";

const YellowSun = ({ className, channel = {} }) => {
  const [spinning, setSpinning] = useState(false);
  const yellowSunRef = useRef();

  useEffect(() => {
    setInterval(() => {
      const worshipPhase = rotationPhase(channel.worshipStickSunRef(), 8);
      const yellowPhase = rotationPhase(yellowSunRef, 24);

      const alignment = (worshipPhase + yellowPhase) % 1;
      setSpinning(alignment > 0.9);
    }, 0);
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
        <img src="/images/yellow_sun.png" className={spinning ? "" : styles.paused} ref={yellowSunRef}  />
      </div>
    </div>
  );
};

export default YellowSun;
