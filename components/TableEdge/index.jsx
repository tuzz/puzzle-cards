import { useRef, useEffect } from "react";
import styles from "./styles.module.scss";

const TableEdge = ({ ratioOfScreenThatIsTableOnPageLoad, children }) => {
  const tableEdge = useRef();

  useEffect(() => {
    if (!ratioOfScreenThatIsTableOnPageLoad) { return; }
    const edgeTop = tableEdge.current.getBoundingClientRect().top;

    const targetRatio = 1 / (1 - ratioOfScreenThatIsTableOnPageLoad);
    const actualRatio = window.innerHeight / edgeTop;

    if (actualRatio < targetRatio) {
      const zoomOut = actualRatio / targetRatio;
      document.body.style.zoom = `${zoomOut * 100}%`;
    }
  }, []);

  return (
    <div className={styles.table_edge} ref={tableEdge}>
      {children}
    </div>
  );
};

export default TableEdge;
