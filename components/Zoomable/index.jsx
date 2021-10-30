import { useRef, useState, useEffect } from "react";
import styles from "./styles.module.scss";

const Zoomable = ({ zoomed = true, rotateWhenZoomedOut = false, rotation = { degrees: null, base: 0, random: 0, initial: null }, duration = 0.5, children }) => {
  const ref = useRef();

  const [angle, setAngle] = useState();
  const [zoom, setZoom] = useState({ scale: 1, rotate: 0, translateX: 0, translateY: 0 });

  useEffect(() => {
    if (zoomed) {
      setZoom(maxZoomThatFitsOnScreen());
    } else {
      const newAngle = chooseAngle(rotation, angle);

      setAngle(newAngle);
      setZoom({ scale: 1, rotate: newAngle, translateX: 0, translateY: 0 });
    }
  }, [zoomed]);

  const maxZoomThatFitsOnScreen = () => {
    const { x, y, width, height } = ref.current.getBoundingClientRect();
    const [maxWidth, maxHeight] = [window.innerWidth * 0.8, window.innerHeight * 0.8];

    const scale = Math.min(maxWidth / width, maxHeight / height);
    const translateX = ((window.innerWidth / 2) - (x + width / 2)) / scale;
    const translateY = ((window.innerHeight / 2) - (y + height / 2)) / scale;

    return { scale, rotate: 0, translateX, translateY };
  };

  const degrees = typeof rotation.degrees === "number" ? rotation.degrees : zoom.rotate;

  const transform = [
    `scale(${zoom.scale})`,
    rotateWhenZoomedOut ? `rotate(${degrees}deg)` : "",
    `translate(${zoom.translateX}px, ${zoom.translateY}px)`,
  ].join(" ");

  return (
    <div className={styles.zoomable} ref={ref} style={{ transform, transitionDuration: `${duration}s` }}>
      {children}
    </div>
  );
};

const chooseAngle = (rotation, previousAngle) => {
  if (typeof previousAngle === "undefined" && typeof rotation.initial === "number") {
    return rotation.initial;
  }

  const randomDegrees = Math.random() * rotation.random;
  const randomDirection = Math.random() < 0.5 ? -1 : 1;

  return rotation.base + randomDegrees * randomDirection;
};

export default Zoomable;
