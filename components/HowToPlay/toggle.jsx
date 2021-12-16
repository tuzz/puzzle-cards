import { useState } from "react";
import styles from "./styles.module.scss";

const Toggle = ({ children }) => {
  const [showing, setShowing] = useState(false);
  const text = showing ? "(Hide again)" : "Show more >";

  return <>
    <button className={styles.toggle_button} onClick={() => setShowing(s => !s)}>
      {text}
    </button>

    {showing && children}
  </>;
};

export default Toggle;
