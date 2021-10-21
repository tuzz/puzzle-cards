import { useState } from "react";
import styles from "./styles.module.scss";
import DragContext from "./context";

const DragRegion = ({ children }) => {
  const [maxZIndex, setMaxZIndex] = useState(0);

  return (
    <div className={styles.drag_region}>
      <DragContext.Provider value={{ maxZIndex, setMaxZIndex }}>
        {children}
      </DragContext.Provider>
    </div>
  );
};

export default DragRegion;
