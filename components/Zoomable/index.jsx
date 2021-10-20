import { useRef, useState, useEffect } from "react";
import styles from "./styles.module.scss";

const Zoomable = ({ zoomed = true, children }) => {
  const ref = useRef();
  const [zoom, setZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    setZoom(zoomed ? maxZoomThatFitsOnScreen() : { scale: 1, offsetX: 0, offsetY: 0 });
  }, [zoomed]);

  const maxZoomThatFitsOnScreen = () => {
    const { x, y, width, height } = ref.current.getBoundingClientRect();
    const [maxWidth, maxHeight] = [window.innerWidth * 0.8, window.innerHeight * 0.8];

    const scale = Math.min(maxWidth / width, maxHeight / height);
    const offsetX = ((window.innerWidth / 2) - (x + width / 2)) / scale;
    const offsetY = ((window.innerHeight / 2) - (y + height / 2)) / scale;

    return { scale, offsetX, offsetY };
  };

  const transform = `scale(${zoom.scale}) translate(${zoom.offsetX}px, ${zoom.offsetY}px)`;

  return (
    <div className={styles.zoomable} ref={ref} style={{ transform }}>
      {children}
    </div>
  );
};

export default Zoomable;
