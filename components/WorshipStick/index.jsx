import { useRef } from "react";
import YellowSun from "../YellowSun";
import styles from "./styles.module.scss";

const WorshipStick = ({ className, spinning = false, rockHeight = 1, raised = true, buttonEnabled = false, onButtonClick = () => {}, channel = {} }) => {
  const stick = useRef();
  const sun = useRef();

  channel.worshipStickRef = () => stick;
  channel.worshipStickSunRef = () => sun;

  channel.distanceFromTop = () => {
    if (!stick.current) { return 0; }

    const transform = getComputedStyle(stick.current).transform;
    const parts = transform.split(/[(,]/).map(s => parseFloat(s));
    const yOffset = parts[parts.length - 1];

    return yOffset;
  };

  channel.waitForStickToFinishMoving = () => {
    return new Promise(resolve => {
      let previous;

      let interval = setInterval(() => {
        const current = channel.distanceFromTop();
        if (current !== previous) { previous = current; return; }

        clearInterval(interval);
        resolve(current);
      }, 100);
    });
  };

  // Calculate the ratio we need to move the stick down by to submerge the rock
  // underground with only the metamask lock showing above the surface.
  const aspectRatio = 2598 / 4508;
  const stickHeight = 1 + 0.2 * aspectRatio;
  const rockHeight_ = (rockHeight - 0.05) * aspectRatio;
  const totalHeight = stickHeight + rockHeight_;
  const belowGround = (rockHeight_ - 0.135) / totalHeight;
  const aboveGround = 0;
  const targetY = raised ? aboveGround : belowGround;

  const classes = [styles.worship_stick, raised && styles.raised, className].join(" ");

  return (
    <div className={classes} style={{ transform: `translateY(${targetY * 100}%` }} ref={stick}>
      <img src="/images/worship_stick_base.png" className={styles.base} />
      <img src="/images/worship_stick_sun.png" className={`${styles.sun} ${!spinning && styles.paused}`} ref={sun} />

      {rockHeight > 0 && <div className={styles.rock} style={{ paddingTop: `${rockHeight * 100}%` }}>
        {onButtonClick && <div className={styles.rock_inner}>
          <button onClick={onButtonClick} disabled={!buttonEnabled}></button>
        </div>}
      </div>}
    </div>
  );
};

export default WorshipStick;
