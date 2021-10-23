import { useRef, useState, useEffect } from "react";
import styles from "./styles.module.scss";

const Zoomable = ({ zoomed = true, rotateWhenZoomedOut = false, rotation = { base: 0, random: 0 }, children }) => {
  const ref = useRef();

  const [angle, setAngle] = useState(0);
  const [zoom, setZoom] = useState({ scale: 1, rotate: 0, translateX: 0, translateY: 0 });

  useEffect(() => {
    if (zoomed) {
      setZoom(maxZoomThatFitsOnScreen());
    } else {
      const newAngle = chooseAngle(rotation);

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

  const transform = [
    `scale(${zoom.scale})`,
    rotateWhenZoomedOut ? `rotate(${zoom.rotate}deg)` : "",
    `translate(${zoom.translateX}px, ${zoom.translateY}px)`,
  ].join(" ");

  return (
    <div className={styles.zoomable} ref={ref} style={{ transform }}>
      {children}
    </div>
  );
};

const chooseAngle = (rotation) => {
  const degrees = Math.random() * rotation.random;
  const direction = Math.random() < 0.5 ? -1 : 1;

  return rotation.base + degrees * direction;
};

export default Zoomable;
