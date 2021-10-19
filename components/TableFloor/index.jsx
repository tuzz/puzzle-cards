import { useRef, useEffect } from "react";
import styles from "./styles.module.scss";

const TableFloor = ({ ratioOfScreenThatIsFloorOnPageLoad }) => {
  const tableFloor = useRef();

  useEffect(() => {
    if (!ratioOfScreenThatIsFloorOnPageLoad) { return; }
    const floorTop = tableFloor.current.getBoundingClientRect().top;

    const targetRatio = 1 / (1 - ratioOfScreenThatIsFloorOnPageLoad);
    const actualRatio = window.innerHeight / floorTop;

    if (actualRatio < targetRatio) {
      const zoomOut = actualRatio / targetRatio;
      document.body.style.zoom = `${zoomOut * 100}%`;
    }
  }, []);

  return <div className={styles.table_floor} ref={tableFloor}></div>;
};

export default TableFloor;
