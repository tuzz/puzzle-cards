import { useState, useEffect } from "react";
import styles from "./styles.module.scss";

const Dropdown = ({ object, className, value, onChange, options }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [selected, setSelected] = useState(options[0]);

  object.setShowMenu = setShowMenu;

  useEffect(() => {
    setSelected(options.find(o => o.value === value));
  }, [value]);

  return (
    <div ref={object.ref} onClick={() => setShowMenu(b => !b)} className={`${styles.dropdown} ${className}`}>
      <span className={styles.placeholder}>{selected.label}</span>
      <span className={styles.chevron}>⌄</span>

      {showMenu && <div className={styles.menu}>
        {options.map(o => (
          <div key={o.value} className={`${o.value === selected.value && styles.selected}`} onClick={(event) => onChange(o.value, event)}>
            {o.label}
            {o.locked && <img src="/images/padlock.png" />}
          </div>
        ))}
      </div>}
    </div>
  );
};

export default Dropdown;
