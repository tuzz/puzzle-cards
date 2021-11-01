import { useState } from "react";
import styles from "./styles.module.scss";

const Dropdown = ({ className, value, onChange, options }) => {
  const [showMenu, setShowMenu] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div onClick={() => setShowMenu(b => !b)} className={`${styles.dropdown} ${className}`}>
      <span className={styles.placeholder}>{selected.label}</span>
      <span className={styles.chevron}>⌄</span>

      {showMenu && <div className={styles.menu}>
        {options.map(o => (
          <div key={o.value} className={`${o.value === selected.value && styles.selected}`} onClick={() => onChange(o.value)}>{o.label}</div>
        ))}
      </div>}
    </div>
  );
};

export default Dropdown;
