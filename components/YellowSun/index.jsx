import { useState, useRef, useEffect } from "react";
import styles from "./styles.module.scss";

const YellowSun = ({ className, stickRaised, channel = {} }) => {
  const yellowSunRef = useRef();

  const [spinning, setSpinning] = useState(false);
  const [poller, setPoller] = useState();

  useEffect(() => {
    if (stickRaised) {
      setPoller(setInterval(meshCogs, 0));
    } else {
      setTimeout(() => {
        setSpinning(false);
        setPoller(i => i && clearInterval(i));
      }, 1200);
    }
  }, [stickRaised]);

  const meshCogs = () => {
    const closeEnough = channel.distanceFromTop() < 15;
    if (!closeEnough) { return; }

    const worshipPhase = rotationPhase(channel.worshipStickSunRef(), 8);
    const yellowPhase = rotationPhase(yellowSunRef, 24);
    const alignment = (worshipPhase + yellowPhase) % 1;
    if (alignment < 0.9) { return ;}

    setSpinning(true);
    setPoller(i => i && clearInterval(i));
  };

  const rotationPhase = (cogRef, numberOfSpokes) => {
    if (!cogRef.current) { return 0; }

    const transform = getComputedStyle(cogRef.current).transform;
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
