import { useState } from "react";
import styles from "./styles.module.scss";
import DragContext from "./context";

const DragRegion = ({ children }) => {
  const [dragContext, setDragContext] = useState({ foo: "bar" });

  return (
    <div className={styles.drag_region}>
      <DragContext.Provider value={dragContext}>
        {children}
      </DragContext.Provider>
    </div>
  );
};

export default DragRegion;
